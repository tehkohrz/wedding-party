"""
Load lunch seats from the seating workbook into the database.

Reads the Seating Plan sheet, matches the name in each seat cell to a guest,
and stores the seat in three guest columns:

    row_num  table number (1-3)
    section  side of the table, "top" or "bottom" with the pool on the left
    seat     position along the table, counted from the pool end

Guests who hold a seat in the database but are no longer on the plan get
their seat cleared, so a re-run after a reshuffle leaves the two in step.

Dry run by default. Pass --apply to write.

    python3 scripts/import-seats.py [--apply] [path/to/workbook.numbers]

Needs numbers-parser (pip install numbers-parser). Reads SUPABASE_URL and
SUPABASE_SECRET_KEY from .env.local and never prints them.
"""

import json
import re
import sys
import urllib.request
import warnings
from pathlib import Path

from numbers_parser import Document
from numbers_parser.cell import Cell

warnings.filterwarnings("ignore")  # numbers-parser warns about fonts it can't load

REPO = Path(__file__).resolve().parent.parent
DEFAULT_WORKBOOK = Path.home() / "Downloads/wedding/Seating Overview.numbers"

# Mirrors FLOOR_TABLES in lib/floorPlan.ts: table number, workbook column of
# its first seat, its last column, and the sheet rows holding each side.
TABLES = [
    (1, 14, 34, {"top": 1, "bottom": 3}),
    (2, 13, 23, {"top": 8, "bottom": 10}),
    (3, 26, 36, {"top": 8, "bottom": 10}),
]

# Seats whose name matches more than one guest exactly, keyed by
# (table, side, position).
SEAT_OVERRIDES = {
    (1, "top", 10): 52,  # Justin in the Yeo family
    (3, "top", 6): 26,  # Justin in NAS
}


def norm(name: str) -> str:
    return re.sub(r"\s+", " ", name.replace("’", "'")).strip().upper()


def read_env() -> dict[str, str]:
    env = {}
    for line in (REPO / ".env.local").read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip()
    return env


def api(env, path, method="GET", body=None):
    key = env["SUPABASE_SECRET_KEY"]
    req = urllib.request.Request(
        env["SUPABASE_URL"].rstrip("/") + "/rest/v1/" + path,
        method=method,
        data=None if body is None else json.dumps(body).encode(),
        headers={
            "apikey": key,
            "Authorization": "Bearer " + key,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as res:
        text = res.read()
        return json.loads(text) if text else None


def read_plan(path: Path) -> dict[tuple, str]:
    """Name in every occupied seat cell, keyed by (table, side, position)."""
    t = Document(str(path)).sheets["Seating Plan"].tables[0]

    def value(r, c):
        # Read the cell's storage directly. numbers-parser's merge handling
        # shifts values on this sheet.
        buf = t._model.storage_buffer(t._table_id, r, c)
        return None if buf is None else Cell._from_storage(t._table_id, r, c, buf, t._model).value

    plan = {}
    for number, first, last, rows in TABLES:
        for side, r in rows.items():
            for c in range(first, last + 1):
                v = value(r, c)
                if isinstance(v, str) and v.strip() and norm(v) != "EMPTY":
                    plan[(number, side, c - first + 1)] = v.strip()
    return plan


def resolve(plan, guests):
    """Guest id for every seat, plus any names that could not be resolved."""
    exact, alias = {}, {}
    for g in guests:
        exact.setdefault(norm(g["name"]), []).append(g["id"])
        for a in (g.get("search_aliases") or "").split(","):
            if a.strip():
                alias.setdefault(norm(a), []).append(g["id"])

    seats, problems = {}, []
    for key, name in sorted(plan.items()):
        ids = exact.get(norm(name)) or alias.get(norm(name)) or []
        if key in SEAT_OVERRIDES and SEAT_OVERRIDES[key] in ids:
            seats[key] = SEAT_OVERRIDES[key]
        elif len(ids) == 1:
            seats[key] = ids[0]
        else:
            problems.append(f"T{key[0]} {key[1]} seat {key[2]}: {name!r} matches {ids or 'no guest'}")
    return seats, problems


def main():
    args = [a for a in sys.argv[1:] if a != "--apply"]
    apply = "--apply" in sys.argv
    workbook = Path(args[0]) if args else DEFAULT_WORKBOOK

    env = read_env()
    guests = api(env, "guests?select=id,name,search_aliases,attending,row_num,section,seat&order=id")
    by_id = {g["id"]: g for g in guests}
    seats, problems = resolve(read_plan(workbook), guests)

    seat_of = {}
    for key, gid in seats.items():
        if gid in seat_of:
            problems.append(f"{by_id[gid]['name']} (id {gid}) is on two seats: {seat_of[gid]} and {key}")
        seat_of[gid] = key
    if problems:
        print("Nothing written. Fix these first:")
        print("\n".join("  " + p for p in problems))
        sys.exit(1)

    unseated = [g["name"] for g in guests if g["attending"] and g["id"] not in seat_of]
    declined = [g["name"] for g in guests if g["id"] in seat_of and not g["attending"]]
    if unseated:
        print("Attending but not on the plan:", ", ".join(unseated))
    if declined:
        print("On the plan but not attending:", ", ".join(declined))

    changes = []
    for g in guests:
        key = seat_of.get(g["id"])
        new = {"row_num": key[0], "section": key[1], "seat": key[2]} if key else {"row_num": None, "section": None, "seat": None}
        if any(g[k] != v for k, v in new.items()):
            changes.append((g, new))

    print(f"{len(seat_of)} guests on the plan, {len(changes)} seat changes.")
    for g, new in changes:
        seat = f"T{new['row_num']} {new['section']} seat {new['seat']}" if new["seat"] else "no seat"
        print(f"  {g['id']:>4}  {g['name']:<22} -> {seat}")

    if not apply:
        print("Dry run. Pass --apply to write.")
        return

    for g, new in changes:
        api(env, f"guests?id=eq.{g['id']}", method="PATCH", body=new)

    after = {g["id"]: g for g in api(env, "guests?select=id,row_num,section,seat")}
    wrong = [
        gid for gid, g in by_id.items()
        if (after[gid]["row_num"], after[gid]["section"], after[gid]["seat"])
        != (seat_of[gid] if gid in seat_of else (None, None, None))
    ]
    print(f"Wrote {len(changes)} guests. Verified: {'all seats match the plan' if not wrong else f'{len(wrong)} mismatches {wrong}'}.")


if __name__ == "__main__":
    main()

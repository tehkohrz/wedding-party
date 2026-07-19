/**
 * The pigeon pair sign-off (public/pigeons.png, transparent cutout) that
 * closes every guest-facing page. The landing/intro details section uses
 * the full size; the RSVP flow steps use `small` so the birds are a quiet
 * footer under the form rather than a second hero.
 */
export function PigeonSignoff({ small = false }: { small?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/pigeons.png"
      alt=""
      aria-hidden
      className={
        small
          ? "mx-auto mt-10 w-28 sm:w-36 select-none pointer-events-none"
          : "mx-auto mt-12 w-52 sm:w-72 select-none pointer-events-none"
      }
    />
  );
}

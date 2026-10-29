// /find is the seating plan on the check-in iPad, opened from the welcome
// screen's "Seating plan" link. It shows the same overview as the
// projector. Being a wizard route, it gets WizardShell's Back/Home buttons
// and idle timer, which bring the iPad back to the welcome screen.

import { SeatingOverviewScreen } from "@/components/SeatingOverviewScreen";

export default function FindPage() {
  return <SeatingOverviewScreen />;
}

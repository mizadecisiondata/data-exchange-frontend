import { redirect } from "next/navigation";

export default function LegacyWorkbenchRedirect() {
  redirect("/internal/dev-monitor");
}

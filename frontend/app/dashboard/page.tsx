import { ensureAuthenticated } from "@/features/auth/server/ensure-authenticated";

export default async function DashboardPage() {
  await ensureAuthenticated();

  return <p>Dashboard page</p>;
}

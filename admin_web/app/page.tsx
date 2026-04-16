import { getDashboardStats, getResults } from "@/lib/actions";
import DashboardClient from "./components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, recentResults] = await Promise.all([
    getDashboardStats(),
    getResults(),
  ]);

  return <DashboardClient stats={stats} recentResults={recentResults} />;
}

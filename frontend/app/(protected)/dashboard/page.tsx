import { DashboardActivitiesChart } from "@/features/dashboard/components/DashboardActivitiesChart";
import { DashboardSummaryCards } from "@/features/dashboard/components/DashboardSummaryCards";
import { DashboardTodayScheduleCard } from "@/features/dashboard/components/DashboardTodayScheduleCard";

export default function DashboardPage() {
  return (
    <div className="space-y-[24px]">
      <DashboardSummaryCards />
      <DashboardActivitiesChart />
      <DashboardTodayScheduleCard />
    </div>
  );
}

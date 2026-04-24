import { DashboardActivitiesChart } from "@/features/dashboard/components/DashboardActivitiesChart";
import { DashboardSummaryCards } from "@/features/dashboard/components/DashboardSummaryCards";
import { DashboardTopProductsCard } from "@/features/dashboard/components/DashboardTopProductsCard";
import { DashboardTodayScheduleCard } from "@/features/dashboard/components/DashboardTodayScheduleCard";

export default function DashboardPage() {
  return (
    <div className="space-y-[24px]">
      <DashboardSummaryCards />
      <DashboardActivitiesChart />
      <div className="grid gap-[24px] xl:grid-cols-2 xl:gap-[36px]">
        <DashboardTopProductsCard />
        <DashboardTodayScheduleCard />
      </div>
    </div>
  );
}

import { StatCards } from "@/components/dashboard/stat-cards";
import { ContinueLearning } from "@/components/dashboard/continue-learning";
import { ModuleProgressList } from "@/components/dashboard/module-progress-list";
import { SidebarCards } from "@/components/dashboard/sidebar-cards";
import { getSession } from "@/lib/auth";
import { getDashboardProgress } from "@/lib/progress";

export default async function DashboardPage() {
  const session = await getSession();
  const firstName = session?.displayName.split(" ")[0] ?? "Student";
  const { percent, completedLessons } = await getDashboardProgress();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Welcome back, {firstName}
      </h1>
      <p className="mt-1.5 text-muted-foreground">
        {completedLessons === 0
          ? "You're just getting started. Mark off your first lesson below."
          : `You're ${percent}% through Off Camera. Keep the momentum going.`}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <StatCards />
          <ContinueLearning />
          <ModuleProgressList />
        </div>
        <SidebarCards />
      </div>
    </div>
  );
}

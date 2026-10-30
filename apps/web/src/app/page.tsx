import { AppShell } from "@/components/layout/app-shell";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      description="Quick overview and AI insights. See Analytics for full reports."
    >
      <DashboardContent />
    </AppShell>
  );
}

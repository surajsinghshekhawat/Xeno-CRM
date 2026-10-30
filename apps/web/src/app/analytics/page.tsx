import { AppShell } from "@/components/layout/app-shell";
import { AnalyticsContent } from "@/components/analytics/analytics-content";

export default function AnalyticsPage() {
  return (
    <AppShell
      title="Analytics"
      description="Customer health segments, campaign engagement, and revenue trends."
    >
      <AnalyticsContent />
    </AppShell>
  );
}

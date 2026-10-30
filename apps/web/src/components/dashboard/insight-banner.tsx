"use client";

import type { Insight } from "@xeno/shared";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function InsightBanner({ insight }: { insight: Insight | null }) {
  if (!insight) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
        No proactive insights right now. Your customer base looks stable.
      </div>
    );
  }

  const message = insight.polishedMessage ?? insight.message;
  const context = encodeURIComponent(JSON.stringify(insight.cta.context));

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
        AI insight
      </p>
      <h2 className="mt-2 text-lg font-semibold text-amber-950">
        {insight.title}
      </h2>
      <p className="mt-2 text-sm text-amber-900">{message}</p>
      <Button asChild className="mt-4">
        <Link href={`/campaigns/new?context=${context}`}>
          {insight.cta.label}
        </Link>
      </Button>
    </div>
  );
}

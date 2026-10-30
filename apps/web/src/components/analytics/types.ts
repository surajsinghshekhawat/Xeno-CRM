export const TAG_META: Record<
  string,
  { label: string; description: string; color: string }
> = {
  VIP: {
    label: "VIP",
    description: "Top 10% by lifetime spend",
    color: "#f59e0b",
  },
  REGULAR: {
    label: "Regular",
    description: "Active repeat buyers",
    color: "#737373",
  },
  NEW: {
    label: "New",
    description: "First purchase within 30 days",
    color: "#0ea5e9",
  },
  AT_RISK: {
    label: "At risk",
    description: "31–60 days inactive, spend declining",
    color: "#f97316",
  },
  LAPSED: {
    label: "Lapsed",
    description: "No purchase in 60+ days",
    color: "#f43f5e",
  },
};

export const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP: "#22c55e",
  SMS: "#3b82f6",
  EMAIL: "#8b5cf6",
  RCS: "#ec4899",
};

export type AnalyticsOverview = {
  summary: {
    totalCustomers: number;
    totalCampaigns: number;
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    healthyCustomerPct: number;
    atRiskCustomerPct: number;
    healthyCount: number;
    atRiskCount: number;
  };
  customerHealth: {
    tag: string;
    count: number;
    avgSpend: number;
    totalSpend: number;
    share: number;
  }[];
  recency: { bucket: string; count: number }[];
  globalFunnel: {
    counts: {
      total: number;
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      converted: number;
      failed: number;
    };
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    failedRate: number;
  };
  channelPerformance: {
    channel: string;
    campaignCount: number;
    recipientCount: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    failedRate: number;
  }[];
  campaignPerformance: {
    id: string;
    name: string;
    channel: string;
    status: string;
    goal: string;
    segmentSize: number;
    createdAt: string;
    completedAt: string | null;
    metrics: {
      counts: {
        total: number;
        delivered: number;
        opened: number;
        clicked: number;
        converted: number;
        failed: number;
      };
      deliveryRate: number;
      openRate: number;
      clickRate: number;
      conversionRate: number;
      failedRate: number;
    };
  }[];
  revenueTrend: { week: string; revenue: number; orders: number }[];
  revenueByOrderChannel: {
    channel: string;
    revenue: number;
    orders: number;
  }[];
  recentPeriodRevenue: number;
};

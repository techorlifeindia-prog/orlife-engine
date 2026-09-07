"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { fetchInstances, Instance } from "@/lib/api-client";
import { getFilteredInstancesForUser } from "@/lib/user-session-utils";
import { StatCards } from "@/components/dashboard/stat-cards";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { TrafficWidget } from "@/components/dashboard/traffic-widget";

export default function DashboardPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [engineOnline, setEngineOnline] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await fetchInstances();
      const userInstances = getFilteredInstancesForUser(data);
      setInstances(userInstances);
      setEngineOnline(true);
    } catch {
      setEngineOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="min-h-full pb-8">
      <Header title="Dashboard Overview" />

      <div className="px-3 py-4 w-full space-y-5">
        {/* Top Metric Cards */}
        <StatCards instances={instances} loading={loading} engineOnline={engineOnline} />

        {/* Analytics & Traffic Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ActivityChart instances={instances} loading={loading} onRefresh={loadDashboardData} />
          <TrafficWidget engineOnline={engineOnline} />
        </div>
      </div>
    </div>
  );
}

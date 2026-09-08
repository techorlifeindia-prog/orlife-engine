"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Plus, RefreshCw, Server, Wifi, WifiOff, Activity, CheckCircle2 } from "lucide-react";
import { fetchInstances, createInstance, logoutInstance, Instance } from "@/lib/api-client";
import { getFilteredInstancesForUser } from "@/lib/user-session-utils";
import { QRModal } from "@/components/devices/qr-modal";
import { TestModal } from "@/components/devices/test-modal";
import { DeviceCard } from "@/components/devices/device-card";
import { useConfirmStore } from "@/lib/confirm-store";

export default function DevicesPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [engineStatus, setEngineStatus] = useState<"checking" | "online" | "offline">("checking");
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);

  // Test modal & active dropdown state
  const [testDevice, setTestDevice] = useState<Instance | null>(null);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const [newInstanceName, setNewInstanceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [currentUser, setCurrentUser] = useState<{ role?: string; phone?: string; email?: string } | null>(null);

  // Device custom labels — persisted in localStorage
  const [deviceLabels, setDeviceLabels] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("orlife_device_labels") || "{}");
    } catch { return {}; }
  });

  const handleSaveLabel = (instanceName: string, label: string) => {
    const updated = { ...deviceLabels, [instanceName]: label };
    setDeviceLabels(updated);
    localStorage.setItem("orlife_device_labels", JSON.stringify(updated));
  };

  const loadData = async () => {
    setLoading(true);
    setEngineStatus("checking");
    try {
      const data = await fetchInstances();
      const filtered = getFilteredInstancesForUser(data);
      setInstances(filtered);
      // Engine is reachable if fetchInstances finishes cleanly
      setEngineStatus("online");
    } catch (e) {
      console.error("Engine check failed:", e);
      setEngineStatus("offline");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleOutsideClick = () => setActiveMenu(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleCreateAndConnect = async () => {
    const name = newInstanceName.trim() || `device_${Date.now()}`;
    setIsCreating(true);
    await createInstance(name);
    setIsCreating(false);
    setNewInstanceName("");
    setSelectedInstance(name);
    setIsQrOpen(true);
    loadData();
  };

  const handleDisconnect = async (instanceName: string) => {
    useConfirmStore.getState().showConfirm({
      title: "Disconnect WhatsApp Device?",
      message: `Are you sure you want to delete/disconnect "${instanceName}"? This will log out the WhatsApp web session.`,
      type: "danger",
      confirmText: "Yes, Disconnect Device",
      onConfirm: async () => {
        await logoutInstance(instanceName);
        loadData();
      },
    });
  };

  return (
    <div className="min-h-full pb-8">
      <Header title="WhatsApp Devices" />

      <div className="px-3 py-4 w-full space-y-4">
        {/* WhatsApp Server Engine Live Health Monitor Banner */}
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-[#163546] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border transition-all ${
              engineStatus === "online"
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : engineStatus === "checking"
                ? "bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse"
                : "bg-rose-500/10 text-rose-500 border-rose-500/30"
            }`}>
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">WhatsApp Engine Server (Local Node.js Baileys)</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#06141c] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#163546]">
                  Port 8080
                </span>
              </div>
              {engineStatus === "online" ? (
                <p className="text-xs font-bold text-emerald-500 mt-1 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)] animate-pulse" />
                  Engine Server ONLINE & Operational ✅
                </p>
              ) : engineStatus === "checking" ? (
                <p className="text-xs font-bold text-amber-500 mt-1 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Checking Port 8080 connection...
                </p>
              ) : (
                <p className="text-xs font-bold text-rose-500 mt-1 flex items-center gap-1.5">
                  <WifiOff className="w-3.5 h-3.5" />
                  Engine Server OFFLINE ❌ (Start Local Server via start_local.bat)
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-200 dark:border-[#163546] pt-3 md:pt-0">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-[#163546] bg-slate-100 dark:bg-[#06141c] hover:bg-slate-200 dark:hover:bg-[#112937] text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
              title="Refresh Instances & Server Health"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-500 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh Health</span>
            </button>

            <div className="flex items-center gap-2 flex-1 md:flex-initial">
              <input
                type="text"
                placeholder="Instance Name (e.g. Sales)"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1b3a4e] bg-slate-50 dark:bg-[#06141c] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#10b981] font-medium w-full sm:w-48"
              />
              <button
                onClick={handleCreateAndConnect}
                disabled={isCreating}
                className="bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-[#10b981]/20 active:scale-95 transition-all shrink-0 disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {isCreating ? "Creating..." : "Link New Device"}
              </button>
            </div>
          </div>
        </div>

        {/* Devices Grid */}
        {loading && instances.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border rounded-xl bg-card/50">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-sm font-medium">Loading WhatsApp instances...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {instances.map((device, idx) => (
              <DeviceCard
                key={device.instanceName || idx}
                device={device}
                customLabel={deviceLabels[device.instanceName]}
                isMenuOpen={activeMenu === device.instanceName}
                onToggleMenu={() =>
                  setActiveMenu(activeMenu === device.instanceName ? null : device.instanceName)
                }
                onCloseMenu={() => setActiveMenu(null)}
                onShowQR={(name) => {
                  setSelectedInstance(name);
                  setIsQrOpen(true);
                }}
                onOpenTest={(dev) => {
                  setTestDevice(dev);
                  setIsTestOpen(true);
                }}
                onDisconnect={handleDisconnect}
                onRefresh={loadData}
                onSaveLabel={handleSaveLabel}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <QRModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        instanceName={selectedInstance || ""}
      />
      <TestModal
        isOpen={isTestOpen}
        onClose={() => setIsTestOpen(false)}
        device={testDevice}
      />
    </div>
  );
}

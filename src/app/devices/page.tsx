"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Plus, RefreshCw } from "lucide-react";
import { fetchInstances, createInstance, logoutInstance, Instance } from "@/lib/api-client";
import { getFilteredInstancesForUser } from "@/lib/user-session-utils";
import { QRModal } from "@/components/devices/qr-modal";
import { TestModal } from "@/components/devices/test-modal";
import { DeviceCard } from "@/components/devices/device-card";

import { useConfirmStore } from "@/lib/confirm-store";

export default function DevicesPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);

  // Test modal & active dropdown state
  const [testDevice, setTestDevice] = useState<Instance | null>(null);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const [newInstanceName, setNewInstanceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [currentUser, setCurrentUser] = useState<{ role?: string; phone?: string; email?: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchInstances();
    const filtered = getFilteredInstancesForUser(data);
    setInstances(filtered);
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

      <div className="px-3 py-4 w-full">
        {/* Page Top Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <p className="text-muted-foreground text-sm">
            Manage your connected WhatsApp Evolution API instances.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={loadData}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition-colors"
              title="Refresh Instances"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder="Instance Name (e.g. Sales)"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-48"
              />
              <button
                onClick={handleCreateAndConnect}
                disabled={isCreating}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shrink-0 disabled:opacity-50"
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

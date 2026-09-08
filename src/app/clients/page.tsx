"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import {
  Building2,
  Search,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useConfirmStore } from "@/lib/confirm-store";
import { SaaSClient } from "@/lib/client-utils";
import { ClientCard } from "@/components/clients/client-card";
import { AddClientModal } from "@/components/clients/add-client-modal";
import { EditClientModal } from "@/components/clients/edit-client-modal";

export default function ClientsPage() {
  const router = useRouter();

  const defaultClients: SaaSClient[] = [
    {
      id: "client-101",
      clientIdCode: "#CLI-101",
      businessName: "Chamunda Industries (Babulal Akoli)",
      ownerName: "Babulal Akoli",
      email: "chamunda@orlife.com",
      phone: "+91 80028 21800",
      loginPassword: "chamunda_pass_123",
      planName: "Enterprise AI",
      planPrice: "₹4,999/mo",
      status: "Active",
      startDate: "2026-08-15",
      expiryDate: "2026-09-15",
      daysRemaining: 9,
      apiKey: "orl_sk_live_chamunda_8002821800_8f9a2b7c4d1e",
      connectedDevicesCount: 1,
      messagesSent: 0,
      messageLimit: 15000,
    },
    {
      id: "client-102",
      clientIdCode: "#CLI-102",
      businessName: "Chit Fund & KhataHisab Automation",
      ownerName: "Vikram Rathore",
      email: "chitfund@khatahisab.in",
      phone: "+91 92465 74995",
      loginPassword: "chitfund_pass_456",
      planName: "Enterprise AI",
      planPrice: "₹4,999/mo",
      status: "Active",
      startDate: "2026-09-01",
      expiryDate: "2026-10-01",
      daysRemaining: 25,
      apiKey: "orl_sk_live_chitfund_9246574995_9a8b7c6d5e4f",
      connectedDevicesCount: 1,
      messagesSent: 12450,
      messageLimit: 25000,
    },
    {
      id: "client-103",
      clientIdCode: "#CLI-103",
      businessName: "Rajputana Traders & Logistics",
      ownerName: "Mahendra Singh",
      email: "sales@rajputanatraders.com",
      phone: "+91 98765 43210",
      loginPassword: "rajputana_pass_789",
      planName: "Pro Automation",
      planPrice: "₹2,499/mo",
      status: "Expiring Soon",
      startDate: "2026-08-08",
      expiryDate: "2026-09-08",
      daysRemaining: 2,
      apiKey: "orl_sk_live_rajputana_9876543210_3a4b5c6d7e8f",
      connectedDevicesCount: 1,
      messagesSent: 4890,
      messageLimit: 5000,
    },
    {
      id: "client-104",
      clientIdCode: "#CLI-104",
      businessName: "Marwar Retail Superstore",
      ownerName: "Dinesh Patel",
      email: "info@marwarretail.in",
      phone: "+91 94140 12345",
      loginPassword: "marwar_pass_999",
      planName: "Starter Hub",
      planPrice: "₹999/mo",
      status: "Expired",
      startDate: "2026-07-01",
      expiryDate: "2026-08-31",
      daysRemaining: -6,
      apiKey: "orl_sk_live_marwar_9414012345_1a2b3c4d5e6f",
      connectedDevicesCount: 1,
      messagesSent: 2000,
      messageLimit: 2000,
    },
  ];

  const [clients, setClients] = useState<SaaSClient[]>(defaultClients);

  // Load data ONCE on mount
  useEffect(() => {
    try {
      const savedClients = localStorage.getItem("orlife_clients_v2");
      if (savedClients) {
        setClients(JSON.parse(savedClients));
      }
    } catch (e) {}
  }, []);

  // Update localStorage helper
  const updateClientsAndSave = (newClients: SaaSClient[]) => {
    setClients(newClients);
    localStorage.setItem("orlife_clients_v2", JSON.stringify(newClients));
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("All");

  const [expandedClientIds, setExpandedClientIds] = useState<Record<string, boolean>>({});

  const toggleExpandClient = (id: string) => {
    setExpandedClientIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editClientModal, setEditClientModal] = useState<SaaSClient | null>(null);

  const [configClient, setConfigClient] = useState<SaaSClient | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [deviceModes, setDeviceModes] = useState<Record<string, string>>({});

  const loadLiveDeviceModes = async () => {
    try {
      const res = await fetch("/api/ai-hub/config?instanceName=all");
      if (res.ok) {
        const data = await res.json();
        const modes: Record<string, string> = {};
        if (data.instances) {
          Object.entries(data.instances).forEach(([key, cfg]: [string, any]) => {
            modes[key] = cfg.mode || "orlife_ai";
          });
        }
        setDeviceModes(modes);

        setClients((prev) => {
          const next = prev.map((client) => {
            const rawDigits = client.phone.replace(/\D/g, "");
            const rawMode =
              modes[rawDigits] ||
              modes[rawDigits.replace(/^91/, "")] ||
              modes[`91${rawDigits}`] ||
              modes[`client_${client.id}`];

            if (!rawMode) return client;

            let updatedPlan: string = client.planName;
            let updatedPrice = client.planPrice;

            if (rawMode === "broadcast_only" || rawMode === "orlife_ai") {
              updatedPlan = "Starter Hub";
              updatedPrice = "₹999/mo";
            } else if (rawMode === "api_webhook") {
              updatedPlan = "Pro Automation";
              updatedPrice = "₹2,499/mo";
            } else if (rawMode === "api_with_ai") {
              updatedPlan = "Enterprise AI";
              updatedPrice = "₹4,999/mo";
            }

            return {
              ...client,
              planName: updatedPlan,
              planPrice: updatedPrice,
            };
          });
          // Also save fetched data
          localStorage.setItem("orlife_clients_v2", JSON.stringify(next));
          return next;
        });
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadLiveDeviceModes();
  }, []);

  const handleExtendPlan = (clientId: string) => {
    const targetClient = clients.find((c) => c.id === clientId);
    useConfirmStore.getState().showConfirm({
      title: "Extend Subscription Plan?",
      message: `Are you sure you want to add +30 days to the subscription for "${targetClient?.businessName || "this client"}"?`,
      type: "success",
      confirmText: "Yes, Add +30 Days",
      onConfirm: () => {
        const updated = clients.map((c) => {
          if (c.id === clientId) {
            const currentExp = new Date(c.expiryDate > new Date().toISOString() ? c.expiryDate : new Date());
            currentExp.setDate(currentExp.getDate() + 30);
            return {
              ...c,
              status: "Active" as const,
              expiryDate: currentExp.toISOString().split("T")[0],
              daysRemaining: c.daysRemaining + 30 > 0 ? c.daysRemaining + 30 : 30,
            };
          }
          return c;
        });
        updateClientsAndSave(updated);
        useConfirmStore.getState().showAlert({
          title: "Subscription Extended",
          message: `Successfully added +30 days to ${targetClient?.businessName}!`,
          type: "success",
        });
      },
    });
  };

  const handleImpersonateClient = (client: SaaSClient) => {
    useConfirmStore.getState().showConfirm({
      title: "Switch to Client Dashboard?",
      message: `Are you sure you want to log in as "${client.businessName}" (${client.email})? You can return to Super Admin Panel anytime using the top header button.`,
      type: "info",
      confirmText: "⚡ Login As Client",
      onConfirm: () => {
        localStorage.setItem("superadmin_impersonating_client", JSON.stringify(client));
        window.dispatchEvent(new Event("user_session_changed"));
        window.location.href = "/";
      },
    });
  };

  const handleSaveEditClient = (updatedClient: SaaSClient) => {
    const updatedList = clients.map((c) => (c.id === updatedClient.id ? updatedClient : c));
    updateClientsAndSave(updatedList);
    setEditClientModal(null);
    useConfirmStore.getState().showAlert({
      title: "Client Profile Saved! ✏️",
      message: `Successfully updated business profile details for "${updatedClient.businessName}".`,
      type: "success",
    });
  };

  const handleDeleteClient = (client: SaaSClient) => {
    useConfirmStore.getState().showConfirm({
      title: "Delete Client?",
      message: `Are you sure you want to delete "${client.businessName}"? This action cannot be undone.`,
      type: "danger",
      confirmText: "Yes, Delete Client",
      onConfirm: () => {
        const updatedList = clients.filter((c) => c.id !== client.id);
        updateClientsAndSave(updatedList);
        setEditClientModal(null);
        useConfirmStore.getState().showAlert({
          title: "Client Removed",
          message: `Successfully deleted ${client.businessName} from system.`,
          type: "info",
        });
      },
    });
  };

  const handleAddClient = (newClient: SaaSClient) => {
    const updatedList = [newClient, ...clients];
    updateClientsAndSave(updatedList);
    setIsAddModalOpen(false);
  };

  const filteredClients = clients.filter((c) => {
    const codeStr = (c.clientIdCode || `#CLI-${c.id.replace(/\D/g, "")}`).toLowerCase();
    const matchesSearch =
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      codeStr.includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === "All" || c.status.toLowerCase() === selectedStatusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const activeCount = clients.filter((c) => c.status === "Active").length;
  const expiringCount = clients.filter((c) => c.status === "Expiring Soon").length;
  const expiredCount = clients.filter((c) => c.status === "Expired").length;

  return (
    <div className="min-h-full pb-12">
      <Header title="Clients & Authentication Controls" />

      <div className="px-3 py-4 w-full space-y-5">
        {/* Top Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setSelectedStatusFilter("All")}
            className={`text-left bg-white dark:bg-[#0b1e28] border rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all hover:scale-[1.02] ${
              selectedStatusFilter === "All"
                ? "border-emerald-500 ring-1 ring-emerald-500 shadow-emerald-500/20"
                : "border-slate-200 dark:border-[#163546]"
            }`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Clients
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {clients.length} Businesses
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> Full Super Admin Control
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
          </button>

          <button
            onClick={() => setSelectedStatusFilter("Active")}
            className={`text-left bg-white dark:bg-[#0b1e28] border rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all hover:scale-[1.02] ${
              selectedStatusFilter === "Active"
                ? "border-cyan-500 ring-1 ring-cyan-500 shadow-cyan-500/20"
                : "border-slate-200 dark:border-[#163546]"
            }`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Subscriptions
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {activeCount} Clients
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                OTP & Password Auth
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </button>

          <button
            onClick={() => setSelectedStatusFilter("Expiring Soon")}
            className={`text-left bg-white dark:bg-[#0b1e28] border rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all hover:scale-[1.02] ${
              selectedStatusFilter === "Expiring Soon"
                ? "border-amber-500 ring-1 ring-amber-500 shadow-amber-500/20"
                : "border-slate-200 dark:border-[#163546]"
            }`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Expiring Soon (7 Days)
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {expiringCount} Clients
              </h3>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1 font-mono">
                Requires Plan Extension
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </button>

          <button
            onClick={() => setSelectedStatusFilter("Expired")}
            className={`text-left bg-white dark:bg-[#0b1e28] border rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all hover:scale-[1.02] ${
              selectedStatusFilter === "Expired"
                ? "border-rose-500 ring-1 ring-rose-500 shadow-rose-500/20"
                : "border-slate-200 dark:border-[#163546]"
            }`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Expired Clients
              </p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {expiredCount} Clients
              </h3>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1 font-mono">
                Access Restricted
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </button>
        </div>

        {/* Filter Bar & Add Client Action */}
        <div className="bg-white dark:bg-[#0b1e28] border border-slate-200 dark:border-[#163546] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto flex-1 flex-wrap">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by client, email, phone, password..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
              />
            </div>


          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 text-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Register New Client
          </button>
        </div>

        {/* Client Cards List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredClients.map((client) => {
            const rawDigits = client.phone.replace(/\D/g, "");
            const rawMode =
              deviceModes[rawDigits] ||
              deviceModes[rawDigits.replace(/^91/, "")] ||
              deviceModes[`91${rawDigits}`] ||
              deviceModes[`client_${client.id}`];

            return (
              <ClientCard
                key={client.id}
                client={client}
                rawMode={rawMode}
                isExpanded={!!expandedClientIds[client.id]}
                onToggleExpand={() => toggleExpandClient(client.id)}
                onOpenEdit={() => setEditClientModal(client)}
                onOpenConfig={() => {
                  router.push("/automation");
                }}
                onImpersonate={() => handleImpersonateClient(client)}
                onExtendPlan={() => handleExtendPlan(client.id)}
              />
            );
          })}

          {/* Client List Quantity Summary Footer */}
          {filteredClients.length > 0 && (
            <div className="px-4 py-3 bg-white dark:bg-[#0b1e28] border border-slate-200 dark:border-[#163546] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono shadow-sm">
              <span className="flex items-center gap-1.5 font-bold">
                📊 Client Quantity:{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {filteredClients.length} SaaS Businesses Listed
                </span>{" "}
                (Total: {clients.length})
              </span>
              <span className="text-[11px] text-slate-500">
                🟢 Active: {activeCount} | ⚠️ Expiring: {expiringCount} | 🔴 Expired: {expiredCount}
              </span>
            </div>
          )}

          {filteredClients.length === 0 && (
            <div className="bg-[#0b1e28] border border-[#163546] rounded-2xl p-12 text-center space-y-3">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-lg font-bold text-white">No Clients Found</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No client matches your search filter. Click "+ Add New Client" to register a new business.
              </p>
            </div>
          )}
        </div>
      </div>

      <EditClientModal
        client={editClientModal}
        onClose={() => setEditClientModal(null)}
        onSave={handleSaveEditClient}
        onDelete={handleDeleteClient}
      />

      <AddClientModal
        isOpen={isAddModalOpen}
        totalClientsCount={clients.length}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddClient}
      />
    </div>
  );
}

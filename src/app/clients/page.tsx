"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import {
  Building2,
  Search,
  Plus,
  ShieldCheck,
  Calendar,
  Key,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Clock,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
  X,
  Lock,
  UserCheck,
  ChevronRight,
  LogIn,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface SaaSClient {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  loginPassword?: string;
  planName: "Enterprise AI SaaS" | "Pro Automation" | "Starter Hub";
  planPrice: string;
  status: "Active" | "Expiring Soon" | "Expired";
  startDate: string;
  expiryDate: string;
  daysRemaining: number;
  apiKey: string;
  connectedDevicesCount: number;
  messagesSent: number;
  messageLimit: number;
}

export default function ClientsPage() {
  const router = useRouter();

  const [clients, setClients] = useState<SaaSClient[]>([
    {
      id: "client-101",
      businessName: "Chamunda Industries (Babulal Akoli)",
      ownerName: "Babulal Akoli",
      email: "chamunda@orlife.com",
      phone: "+91 80028 21800",
      loginPassword: "chamunda_pass_123",
      planName: "Enterprise AI SaaS",
      planPrice: "₹4,999/mo",
      status: "Active",
      startDate: "2026-08-15",
      expiryDate: "2026-09-15",
      daysRemaining: 9,
      apiKey: "orlife_sec_chamunda_8002821800_2026",
      connectedDevicesCount: 2,
      messagesSent: 8420,
      messageLimit: 15000,
    },
    {
      id: "client-102",
      businessName: "Chit Fund & KhataHisab Automation",
      ownerName: "Vikram Rathore",
      email: "chitfund@khatahisab.in",
      phone: "+91 92465 74995",
      loginPassword: "chitfund_pass_456",
      planName: "Enterprise AI SaaS",
      planPrice: "₹4,999/mo",
      status: "Active",
      startDate: "2026-09-01",
      expiryDate: "2026-10-01",
      daysRemaining: 25,
      apiKey: "orlife_sec_chitfund_9246574995_2026",
      connectedDevicesCount: 3,
      messagesSent: 12450,
      messageLimit: 25000,
    },
    {
      id: "client-103",
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
      apiKey: "orlife_sec_rajputana_9876543210_2026",
      connectedDevicesCount: 1,
      messagesSent: 4890,
      messageLimit: 5000,
    },
    {
      id: "client-104",
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
      apiKey: "orlife_sec_marwar_9414012345_2026",
      connectedDevicesCount: 1,
      messagesSent: 2000,
      messageLimit: 2000,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("All");
  const [visibleApiKeys, setVisibleApiKeys] = useState<Record<string, boolean>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("123456");
  const [newPlan, setNewPlan] = useState<SaaSClient["planName"]>("Enterprise AI SaaS");
  const [newValidityDays, setNewValidityDays] = useState(30);

  // Password Reset Modal State
  const [resetModalClient, setResetModalClient] = useState<SaaSClient | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState("");

  const toggleApiKeyVisibility = (id: string) => {
    setVisibleApiKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExtendPlan = (clientId: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const currentExp = new Date(c.expiryDate > new Date().toISOString() ? c.expiryDate : new Date());
          currentExp.setDate(currentExp.getDate() + 30);
          return {
            ...c,
            status: "Active",
            expiryDate: currentExp.toISOString().split("T")[0],
            daysRemaining: c.daysRemaining + 30 > 0 ? c.daysRemaining + 30 : 30,
          };
        }
        return c;
      })
    );
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalClient || !resetNewPassword.trim()) return;

    setClients((prev) =>
      prev.map((c) => (c.id === resetModalClient.id ? { ...c, loginPassword: resetNewPassword.trim() } : c))
    );

    alert(`Password for ${resetModalClient.businessName} successfully reset to "${resetNewPassword.trim()}"!`);
    setResetModalClient(null);
    setResetNewPassword("");
  };

  const handleImpersonateClient = (client: SaaSClient) => {
    localStorage.setItem("superadmin_impersonating_client", JSON.stringify(client));
    alert(`Super Admin Mode: Logging into dashboard as Client "${client.businessName}" (${client.email})`);
    router.push("/");
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusinessName.trim() || !newPhone.trim()) {
      alert("Business Name and Phone number are required!");
      return;
    }

    const today = new Date();
    const expDate = new Date();
    expDate.setDate(today.getDate() + Number(newValidityDays));

    const cleanPhone = newPhone.replace(/\D/g, "");
    const generatedKey = `orlife_sec_${newBusinessName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${cleanPhone}_2026`;

    const newClient: SaaSClient = {
      id: `client-${Date.now()}`,
      businessName: newBusinessName.trim(),
      ownerName: newOwnerName.trim() || "Client Owner",
      email: newEmail.trim() || `${newBusinessName.toLowerCase().replace(/\s+/g, "")}@client.com`,
      phone: newPhone.trim(),
      loginPassword: newPassword.trim() || "123456",
      planName: newPlan,
      planPrice: newPlan === "Enterprise AI SaaS" ? "₹4,999/mo" : newPlan === "Pro Automation" ? "₹2,499/mo" : "₹999/mo",
      status: "Active",
      startDate: today.toISOString().split("T")[0],
      expiryDate: expDate.toISOString().split("T")[0],
      daysRemaining: Number(newValidityDays),
      apiKey: generatedKey,
      connectedDevicesCount: 1,
      messagesSent: 0,
      messageLimit: newPlan === "Enterprise AI SaaS" ? 25000 : newPlan === "Pro Automation" ? 10000 : 2000,
    };

    setClients([newClient, ...clients]);
    setIsAddModalOpen(false);
    setNewBusinessName("");
    setNewOwnerName("");
    setNewEmail("");
    setNewPhone("");
    setNewPassword("123456");
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === "All" || c.status.toLowerCase() === selectedStatusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const activeCount = clients.filter((c) => c.status === "Active").length;
  const expiringCount = clients.filter((c) => c.status === "Expiring Soon").length;
  const expiredCount = clients.filter((c) => c.status === "Expired").length;

  return (
    <div className="min-h-full pb-12">
      <Header title="SaaS Clients & Authentication Controls" />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0b1e28] border border-[#163546] rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total SaaS Clients</p>
              <h3 className="text-2xl font-bold text-white mt-1">{clients.length} Businesses</h3>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> Full Super Admin Control
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#0b1e28] border border-[#163546] rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Subscriptions</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{activeCount} Clients</h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">OTP & Password Auth</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#0b1e28] border border-[#163546] rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expiring Soon (7 Days)</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">{expiringCount} Clients</h3>
              <p className="text-xs text-amber-400/80 mt-1 font-mono">Requires Plan Extension</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#0b1e28] border border-[#163546] rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expired Clients</p>
              <h3 className="text-2xl font-bold text-rose-400 mt-1">{expiredCount} Clients</h3>
              <p className="text-xs text-rose-400/80 mt-1 font-mono">Access Restricted</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter Bar & Add Client Action */}
        <div className="bg-[#0b1e28] border border-[#163546] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by client, email, phone, password..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#06141b] border border-[#163546] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div className="flex items-center bg-[#06141b] p-1 rounded-xl border border-[#163546]">
              {["All", "Active", "Expiring Soon", "Expired"].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedStatusFilter === st
                      ? "bg-[#10b981] text-black shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 text-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Register New SaaS Client
          </button>
        </div>

        {/* Client Cards List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredClients.map((client) => {
            const isApiKeyShown = visibleApiKeys[client.id] || false;
            const isPasswordShown = visiblePasswords[client.id] || false;
            const isCopied = copiedId === client.id;
            const usagePercent = Math.round((client.messagesSent / client.messageLimit) * 100);

            return (
              <div
                key={client.id}
                className="bg-[#0b1e28] border border-[#163546] hover:border-emerald-500/40 rounded-2xl p-6 transition-all shadow-xl space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#163546] pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      {client.businessName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-lg text-white">{client.businessName}</h3>
                        <span
                          className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                            client.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : client.status === "Expiring Soon"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {client.status === "Active"
                            ? `🟢 Active (${client.daysRemaining} Days Left)`
                            : client.status === "Expiring Soon"
                            ? `⚠️ Expiring in ${client.daysRemaining} Days`
                            : "🔴 Plan Expired"}
                        </span>
                        <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full text-xs font-mono">
                          {client.planName} ({client.planPrice})
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                        <span>Owner: <strong className="text-slate-200">{client.ownerName}</strong></span>
                        <span>•</span>
                        <span>Phone: <strong className="text-emerald-400 font-mono">{client.phone}</strong></span>
                        <span>•</span>
                        <span>Email: <strong className="text-slate-300">{client.email}</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* Super Admin Quick Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleImpersonateClient(client)}
                      className="px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                      title="Super Admin 1-Click Login into Client Account"
                    >
                      <LogIn className="w-3.5 h-3.5" /> 1-Click Login As Client
                    </button>
                    <button
                      onClick={() => setResetModalClient(client)}
                      className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset Password
                    </button>
                    <button
                      onClick={() => handleExtendPlan(client.id)}
                      className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Extend Plan (+30 Days)
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  {/* Super Admin Password View / Reset */}
                  <div className="bg-[#06141b] border border-[#163546] rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                        <Lock className="w-3.5 h-3.5" /> Login Password
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(client.id)}
                        className="text-slate-400 hover:text-white"
                      >
                        {isPasswordShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 font-mono bg-black/40 px-2.5 py-1.5 rounded-lg border border-[#163546]">
                      <span className="text-amber-300 font-semibold truncate">
                        {isPasswordShown ? client.loginPassword || "123456" : "••••••••••••"}
                      </span>
                      <button
                        onClick={() => setResetModalClient(client)}
                        className="text-amber-400 hover:underline text-[11px]"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Secret API Token */}
                  <div className="bg-[#06141b] border border-[#163546] rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                        <Key className="w-3.5 h-3.5" /> Secret API Token
                      </span>
                      <button
                        onClick={() => toggleApiKeyVisibility(client.id)}
                        className="text-slate-400 hover:text-white"
                      >
                        {isApiKeyShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 font-mono bg-black/40 px-2.5 py-1.5 rounded-lg border border-[#163546]">
                      <span className="text-slate-200 truncate">
                        {isApiKeyShown ? client.apiKey : "••••••••••••••••••••••••••••••••"}
                      </span>
                      <button
                        onClick={() => copyToClipboard(client.apiKey, client.id)}
                        className="text-slate-400 hover:text-emerald-400 transition-colors p-1"
                        title="Copy API Secret Key"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Plan Validity Dates */}
                  <div className="bg-[#06141b] border border-[#163546] rounded-xl p-3 space-y-1.5">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Plan Expiry Date
                    </span>
                    <div className="flex items-center justify-between font-mono text-slate-300">
                      <div>
                        <p className="text-[10px] text-slate-500">START</p>
                        <p className="font-semibold">{client.startDate}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500">EXPIRY</p>
                        <p className={`font-semibold ${client.daysRemaining < 7 ? "text-amber-400" : "text-emerald-400"}`}>
                          {client.expiryDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Message Quota & Usage Bar */}
                  <div className="bg-[#06141b] border border-[#163546] rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 font-semibold">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Zap className="w-3.5 h-3.5" /> API Messages Quota
                      </span>
                      <span className="font-mono text-slate-300">
                        {client.messagesSent.toLocaleString()} / {client.messageLimit.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-[#163546] h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full transition-all rounded-full ${
                          usagePercent > 90
                            ? "bg-rose-500"
                            : usagePercent > 70
                            ? "bg-amber-400"
                            : "bg-gradient-to-r from-emerald-500 to-teal-400"
                        }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredClients.length === 0 && (
            <div className="bg-[#0b1e28] border border-[#163546] rounded-2xl p-12 text-center space-y-3">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-lg font-bold text-white">No SaaS Clients Found</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No client matches your search filter. Click "+ Add New SaaS Client" to register a new business.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetModalClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1e28] border border-[#163546] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#163546] pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" /> Reset Password for Client
              </h3>
              <button onClick={() => setResetModalClient(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 bg-[#06141b] p-3 rounded-xl border border-[#163546]">
              <p>Client: <strong className="text-white">{resetModalClient.businessName}</strong></p>
              <p>Email: <strong className="text-emerald-400">{resetModalClient.email}</strong></p>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Set New Client Password *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter new password (e.g. 123456)"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#06141b] border border-[#163546] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-[#163546] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalClient(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl shadow-lg"
                >
                  Update Client Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1e28] border border-[#163546] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#163546] pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" /> Register New SaaS Client
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Business / Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chamunda Industries, Chit Fund SaaS"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#06141b] border border-[#163546] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Owner Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Babulal Akoli"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#06141b] border border-[#163546] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 80028 21800"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#06141b] border border-[#163546] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Client Email Address</label>
                  <input
                    type="email"
                    placeholder="client@orlife.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#06141b] border border-[#163546] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Login Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123456"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#06141b] border border-[#163546] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select SaaS Plan</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as SaaSClient["planName"])}
                    className="w-full px-3.5 py-2.5 bg-[#06141b] border border-[#163546] rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Enterprise AI SaaS">Enterprise AI SaaS (₹4,999/mo)</option>
                    <option value="Pro Automation">Pro Automation (₹2,499/mo)</option>
                    <option value="Starter Hub">Starter Hub (₹999/mo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plan Validity (Days)</label>
                  <input
                    type="number"
                    value={newValidityDays}
                    onChange={(e) => setNewValidityDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#06141b] border border-[#163546] rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#163546] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold rounded-xl shadow-lg"
                >
                  Save & Generate Client Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

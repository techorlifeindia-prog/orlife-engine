"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Search, UserPlus, ShieldCheck, Mail, Phone, Lock, Edit3, Trash2, CheckCircle2, UserCheck, X, KeyRound, Sparkles } from "lucide-react";

import { useConfirmStore } from "@/lib/confirm-store";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "Super Admin" | "Manager" | "Operator";
  status: "Active" | "Inactive";
  lastLogin: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([
    {
      id: "1",
      name: "Babulal Ghanchi",
      email: "super@gmail.com",
      phone: "+91 92465 74995",
      role: "Super Admin",
      status: "Active",
      lastLogin: "Just Now",
    },
    {
      id: "2",
      name: "Operations Manager",
      email: "manager@orlife.com",
      phone: "+91 98765 43210",
      role: "Manager",
      status: "Active",
      lastLogin: "2 hours ago",
    },
    {
      id: "3",
      name: "Support Executive",
      email: "support@orlife.com",
      phone: "+91 98765 12345",
      role: "Operator",
      status: "Active",
      lastLogin: "5 mins ago",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("All");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<UserRecord["role"]>("Operator");
  const [newPassword, setNewPassword] = useState("123456");

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      useConfirmStore.getState().showAlert({
        title: "Required Fields Missing",
        message: "User Name and Email Address are required!",
        type: "warning",
      });
      return;
    }

    const newUser: UserRecord = {
      id: Date.now().toString(),
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || "+91 98765 43210",
      role: newRole,
      status: "Active",
      lastLogin: "Never",
    };

    setUsers([newUser, ...users]);
    setIsAddModalOpen(false);

    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewPassword("123456");

    useConfirmStore.getState().showAlert({
      title: "User Created",
      message: `User "${newUser.name}" was successfully registered with role ${newUser.role}.`,
      type: "success",
    });
  };

  const handleDeleteUser = (id: string, name: string) => {
    useConfirmStore.getState().showConfirm({
      title: "Remove Portal User?",
      message: `Are you sure you want to remove user "${name}"? They will lose access to the portal immediately.`,
      type: "danger",
      confirmText: "Yes, Remove User",
      onConfirm: () => {
        setUsers(users.filter((u) => u.id !== id));
        useConfirmStore.getState().showAlert({
          title: "User Removed",
          message: `User "${name}" has been deleted.`,
          type: "info",
        });
      },
    });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);

    const matchesRole = selectedRoleFilter === "All" || user.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-full pb-8">
      <Header title="Users & Role Permissions" />

      <div className="px-3 py-4 w-full space-y-5">
        {/* Toolbar: Search, Role Filters, Add User Button */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] p-4 rounded-2xl shadow-sm">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user by name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-medium transition-colors"
            />
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
            {["All", "Super Admin", "Manager", "Operator"].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRoleFilter(role)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  selectedRoleFilter === role
                    ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-500/40 shadow-sm"
                    : "bg-slate-50 dark:bg-[#06141c] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#1b3a4e] hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Add User Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Add New User
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#06141c] border-b border-slate-200 dark:border-[#1b3a4e] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">S.No</th>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">WhatsApp Phone</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#183647] text-slate-800 dark:text-slate-200 font-sans">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                      No matching users found. Click "Add New User" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-[#0f2736] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-center text-slate-500 dark:text-slate-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono text-xs shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{user.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {user.email}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {user.phone}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            user.role === "Super Admin"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                              : user.role === "Manager"
                              ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30"
                              : "bg-slate-200 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600/40"
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              useConfirmStore.getState().showAlert({
                                title: "Password Reset Link Sent",
                                message: `Password reset instructions have been dispatched to ${user.email}.`,
                                type: "info",
                              })
                            }
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#06141c] hover:bg-amber-50 dark:hover:bg-[#183647] text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-[#1b3a4e] transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#06141c] hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-[#1b3a4e] transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-[#06141c] border-t border-slate-200 dark:border-[#1b3a4e] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>Total Registered System Users: {users.length}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Super Admin Account: super@gmail.com</span>
          </div>
        </div>

        {/* Modal: Add New User */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-emerald-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-[#183647] flex items-center justify-between bg-slate-50 dark:bg-[#06141c]">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Add New Portal User
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. user@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">WhatsApp Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">System Role Permission</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRecord["role"])}
                    className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Operator" className="bg-white dark:bg-[#06141c] text-slate-900 dark:text-slate-100">Operator (Campaign & Contacts Access)</option>
                    <option value="Manager" className="bg-white dark:bg-[#06141c] text-slate-900 dark:text-slate-100">Manager (Full Dashboard & Device Access)</option>
                    <option value="Super Admin" className="bg-white dark:bg-[#06141c] text-slate-900 dark:text-slate-100">Super Admin (Full System Control)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Initial Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="bg-slate-100 dark:bg-[#06141c] hover:bg-slate-200 dark:hover:bg-[#183647] text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded-xl font-bold shadow-md shadow-emerald-500/20"
                  >
                    Save User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

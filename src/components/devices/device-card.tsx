"use client";

import { Instance } from "@/lib/api-client";
import {
  BatteryMedium,
  MoreVertical,
  QrCode,
  SignalHigh,
  Trash2,
  RefreshCw,
  FlaskConical,
} from "lucide-react";

interface DeviceCardProps {
  device: Instance;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onShowQR: (instanceName: string) => void;
  onOpenTest: (device: Instance) => void;
  onDisconnect: (instanceName: string) => void;
  onRefresh: () => void;
}

export function DeviceCard({
  device,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onShowQR,
  onOpenTest,
  onDisconnect,
  onRefresh,
}: DeviceCardProps) {
  const isConnected = device.status === "open";
  const displayName = device.profileName || device.owner || device.instanceName;
  const formattedOwner = device.owner ? `+${device.owner.replace(/^\+/, "")}` : "Not linked";

  return (
    <div
      className={`p-6 rounded-2xl border bg-card shadow-lg hover:shadow-2xl transition-all relative group ${
        isMenuOpen ? "z-40 ring-2 ring-emerald-500/50 border-emerald-500/60" : "z-10 border-border"
      }`}
    >
      {/* Accent left status line */}
      <div
        className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl ${
          isConnected ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-amber-500"
        }`}
      ></div>

      <div className="flex justify-between items-start mb-4 pl-1">
        <div>
          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"
                  : "bg-amber-500"
              }`}
            ></span>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isConnected ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* Profile Name & Number */}
          <h3 className="font-bold text-xl text-foreground tracking-tight">{displayName}</h3>
          <p className="text-sm font-semibold text-muted-foreground mt-1">{formattedOwner}</p>
        </div>

        {/* 3-Dots Options Menu */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleMenu}
            className={`p-2.5 rounded-xl transition-all ${
              isMenuOpen
                ? "bg-emerald-500 text-slate-950 shadow-md font-bold"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
            title="Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Dropdown Menu Popup */}
          {isMenuOpen && (
            <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-emerald-500/30 bg-[#0d1d26] shadow-2xl p-1.5 text-sm animate-in fade-in zoom-in-95 duration-150">
              {isConnected && (
                <button
                  onClick={() => {
                    onCloseMenu();
                    onOpenTest(device);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left rounded-xl hover:bg-emerald-500/20 text-emerald-300 font-medium transition-colors"
                >
                  <FlaskConical className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Send Test Message</span>
                </button>
              )}

              <button
                onClick={() => {
                  onCloseMenu();
                  onRefresh();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left rounded-xl hover:bg-slate-800 text-slate-200 font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Refresh Status</span>
              </button>

              <div className="my-1 border-t border-slate-700/80"></div>

              <button
                onClick={() => {
                  onCloseMenu();
                  onDisconnect(device.instanceName);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left rounded-xl hover:bg-red-500/20 text-red-400 font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>Delete Device</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/80 text-xs font-medium text-muted-foreground pl-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <SignalHigh className="w-4 h-4 text-emerald-400" />
            <span className="text-foreground/90 font-semibold">{isConnected ? "Active" : "Offline"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BatteryMedium className="w-4 h-4 text-muted-foreground" />
            <span>90%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isConnected ? (
            <button
              onClick={() => onShowQR(device.instanceName)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 text-xs"
            >
              <QrCode className="w-4 h-4" /> Show QR
            </button>
          ) : (
            <>
              <button
                onClick={() => onOpenTest(device)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 active:scale-95 text-xs"
              >
                <FlaskConical className="w-4 h-4" /> Send Test
              </button>
              <button
                onClick={() => onDisconnect(device.instanceName)}
                className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 active:scale-95 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" /> Disconnect
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

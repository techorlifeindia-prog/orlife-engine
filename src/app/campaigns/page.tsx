"use client";

// ============================================================
// WhatsApp Center Page — Composition Only (Thin Orchestrator)
// ============================================================

import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Smartphone, Users, Send } from "lucide-react";
import { useCampaignStore } from "@/components/campaigns/use-campaign-store";
import { StatusTab } from "@/components/campaigns/status-tab";
import { GroupsTab } from "@/components/campaigns/groups-tab";
import { ScheduleTab } from "@/components/campaigns/schedule-tab";

function WhatsAppCenterContent() {
  const store = useCampaignStore();

  return (
    <div className="min-h-full pb-8 bg-slate-50 dark:bg-[#06141b]">
      <Header title="WhatsApp Center & Automated Messaging" />

      <div className="px-3 py-3 w-full space-y-4">
        {/* Main 3-Tab Control Bar */}
        <div className="glass-card flex items-center justify-between p-2 rounded-2xl shadow-md">
          <div className="flex items-center gap-2">
            {[
              { key: "status" as const, icon: Smartphone, label: "Status & Speed" },
              { key: "groups" as const, icon: Users, label: "Groups & Audience" },
              { key: "schedule" as const, icon: Send, label: "Schedule & Dispatch" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => store.handleTabChange(tab.key)}
                className={`px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                  store.activeTab === tab.key
                    ? "bg-[#10b981] text-slate-950 shadow-md shadow-[#10b981]/25"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112937]"
                }`}
              >

                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 pr-2">
            <span className={`text-[11px] font-mono px-3 py-1 rounded-xl border flex items-center gap-1.5 font-bold ${
              store.isDeviceOnline
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                : "text-slate-500 bg-slate-500/10 border-slate-500/30"
            }`}>
              <span className={`w-2 h-2 rounded-full ${store.isDeviceOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
              {store.isDeviceOnline ? "Engine Ready" : "Offline"}
            </span>
          </div>
        </div>

        {/* TAB 1: STATUS & ANTI-BAN SPEED */}
        {store.activeTab === "status" && (
          <StatusTab
            speedMode={store.speedMode}
            onSpeedChange={store.setSpeedMode}
            deviceProfileName={store.deviceProfileName}
            deviceOwnerNumber={store.deviceOwnerNumber}
            isDeviceOnline={store.isDeviceOnline}
          />
        )}

        {/* TAB 2: GROUPS & AUDIENCE */}
        {store.activeTab === "groups" && (
          <GroupsTab
            groupNameInput={store.groupNameInput}
            setGroupNameInput={store.setGroupNameInput}
            groupContactsInput={store.groupContactsInput}
            setGroupContactsInput={store.setGroupContactsInput}
            savedGroupsList={store.savedGroupsList}
            groupSearchQuery={store.groupSearchQuery}
            setGroupSearchQuery={store.setGroupSearchQuery}
            nativeGroups={store.nativeGroups}
            loadingNativeGroups={store.loadingNativeGroups}
            onSaveBroadcastGroup={store.handleSaveBroadcastGroup}
            onFetchNativeGroups={store.handleFetchNativeGroups}
            onLoadNativeGroupToForm={store.handleLoadNativeGroupToForm}
            onSaveNativeGroup={store.handleSaveNativeGroup}
            onExportGroup={store.handleExportGroup}
            onDeleteSavedGroup={store.handleDeleteSavedGroup}
            onSelectAndDispatch={(groupId) => {
              store.setSelectedGroupId(groupId);
              store.handleTabChange("schedule");
            }}
            onTabChange={store.handleTabChange}
            onLoadGroupToForm={store.handleLoadGroupToForm}
          />
        )}

        {/* TAB 3: SCHEDULE & DISPATCH */}
        {store.activeTab === "schedule" && (
          <ScheduleTab
            savedGroupsList={store.savedGroupsList}
            selectedGroupId={store.selectedGroupId}
            setSelectedGroupId={store.setSelectedGroupId}
            deliveryMode={store.deliveryMode}
            setDeliveryMode={store.setDeliveryMode}
            scheduleTime={store.scheduleTime}
            setScheduleTime={store.setScheduleTime}
            dispatchMessageText={store.dispatchMessageText}
            setDispatchMessageText={store.setDispatchMessageText}
            dispatchMediaUrl={store.dispatchMediaUrl}
            setDispatchMediaUrl={store.setDispatchMediaUrl}
            campaignLogs={store.campaignLogs}
            scheduledCampaigns={store.scheduledCampaigns}
            selectedLogDetail={store.selectedLogDetail}
            setSelectedLogDetail={store.setSelectedLogDetail}
            isDispatching={store.isDispatching}
            onLaunchCampaign={store.handleLaunchCampaign}
            onImageUpload={store.handleImageUpload}
            onClearLogs={store.handleClearLogs}
            onClearScheduled={store.handleClearScheduled}
            onDeleteScheduledCampaign={store.handleDeleteScheduledCampaign}
            onSaveMessageDefault={store.handleSaveMessageDefault}
            mediaFileInputRef={store.mediaFileInputRef}
          />
        )}
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading WhatsApp Center...</div>}>
      <WhatsAppCenterContent />
    </Suspense>
  );
}

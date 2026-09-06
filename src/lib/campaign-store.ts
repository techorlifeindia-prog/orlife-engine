import { create } from 'zustand';

export interface CampaignRecipient {
  name: string;
  phone: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  error?: string;
}

export interface Campaign {
  id: string;
  name: string;
  instanceName: string;
  messageTemplate: string;
  recipients: CampaignRecipient[];
  minDelaySeconds: number;
  maxDelaySeconds: number;
  status: 'idle' | 'running' | 'completed' | 'paused';
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

interface CampaignStore {
  campaigns: Campaign[];
  activeCampaign: Campaign | null;
  addCampaign: (campaign: Campaign) => void;
  updateCampaignProgress: (id: string, sentCount: number, failedCount: number, recipientIndex?: number, status?: 'sent' | 'failed') => void;
  setCampaignStatus: (id: string, status: Campaign['status']) => void;
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  campaigns: [],
  activeCampaign: null,
  addCampaign: (campaign) =>
    set((state) => ({
      campaigns: [campaign, ...state.campaigns],
      activeCampaign: campaign,
    })),
  updateCampaignProgress: (id, sentCount, failedCount, recipientIndex, recipientStatus) =>
    set((state) => ({
      campaigns: state.campaigns.map((c) => {
        if (c.id !== id) return c;
        const updatedRecipients = [...c.recipients];
        if (recipientIndex !== undefined && recipientStatus && updatedRecipients[recipientIndex]) {
          updatedRecipients[recipientIndex] = {
            ...updatedRecipients[recipientIndex],
            status: recipientStatus,
          };
        }
        return {
          ...c,
          sentCount,
          failedCount,
          recipients: updatedRecipients,
        };
      }),
    })),
  setCampaignStatus: (id, status) =>
    set((state) => ({
      campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, status } : c)),
    })),
}));

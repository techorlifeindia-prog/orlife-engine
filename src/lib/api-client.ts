export interface Instance {
  instanceName: string;
  instanceId?: string;
  status: 'open' | 'connecting' | 'close';
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
}

export interface QRCodeResponse {
  pairingCode?: string;
  code?: string;
  base64?: string;
  count?: number;
  status?: string;
  owner?: string;
}

export interface FetchInstancesResult {
  instances: Instance[];
  isOnline: boolean;
}

export async function fetchInstances(): Promise<Instance[]> {
  try {
    const res = await fetch('/api/evolution/instances');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchInstancesWithStatus(): Promise<FetchInstancesResult> {
  try {
    const res = await fetch('/api/evolution/instances');
    if (!res.ok) {
      return { instances: [], isOnline: false };
    }
    const data = await res.json();
    return { instances: Array.isArray(data) ? data : [], isOnline: true };
  } catch {
    return { instances: [], isOnline: false };
  }
}

export async function createInstance(instanceName: string): Promise<boolean> {
  try {
    const res = await fetch('/api/evolution/instances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceName }),
    });
    return res.ok;
  } catch (error) {
    console.error('Error creating instance:', error);
    return false;
  }
}

export async function fetchQRCode(instanceName: string): Promise<QRCodeResponse | null> {
  try {
    const res = await fetch(`/api/evolution/qr?instanceName=${encodeURIComponent(instanceName)}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return errData || null;
    }
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export async function logoutInstance(instanceName: string): Promise<boolean> {
  try {
    const res = await fetch('/api/evolution/instances', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceName }),
    });
    return res.ok;
  } catch (error) {
    console.error('Error logging out instance:', error);
    return false;
  }
}

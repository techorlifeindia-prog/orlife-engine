"use client";

import { useEffect, useState, useRef } from "react";
import { X, RefreshCw, Smartphone, QrCode, WifiOff, CheckCircle2, PartyPopper } from "lucide-react";
import { fetchQRCode } from "@/lib/api-client";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  instanceName: string;
}

export function QRModal({ isOpen, onClose, onSuccess, instanceName }: QRModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [connectedOwner, setConnectedOwner] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const loadQR = async () => {
    if (!instanceName || isSuccess) return;

    try {
      const data = await fetchQRCode(instanceName);
      if (!isMountedRef.current) return;

      // Check if WhatsApp has connected successfully!
      if (data?.status === "open") {
        setIsSuccess(true);
        setConnectedOwner(data.owner || "WhatsApp Account");
        setLoading(false);
        if (onSuccess) onSuccess();

        // Auto-close modal after 2 seconds
        setTimeout(() => {
          if (isMountedRef.current) {
            onClose();
          }
        }, 2000);
        return;
      }

      if (data?.base64 && data.base64.startsWith("data:image") && data.base64.length > 200) {
        setQrCode(data.base64);
        setIsDemoMode(false);
        setLoading(false);
      } else if (data?.code === "real-whatsapp-qr" && data?.base64) {
        setQrCode(data.base64);
        setIsDemoMode(false);
        setLoading(false);
      } else if (data?.status === "offline" || !data) {
        setQrCode(null);
        setIsDemoMode(true);
        setLoading(false);
      } else {
        setIsDemoMode(false);
      }

      if (data?.pairingCode && data.pairingCode !== "1234-5678") {
        setPairingCode(data.pairingCode);
      } else {
        setPairingCode(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setIsDemoMode(true);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (!isOpen || !instanceName) {
      setQrCode(null);
      setIsSuccess(false);
      setLoading(true);
      return;
    }

    setLoading(true);
    setQrCode(null);
    setIsSuccess(false);
    setIsDemoMode(false);

    loadQR();

    const interval = setInterval(() => {
      loadQR();
    }, 2000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [isOpen, instanceName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border text-card-foreground rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Link WhatsApp Account</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Instance: <span className="font-semibold text-primary">{instanceName}</span>
          </p>
        </div>

        <div className="bg-muted/40 border border-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[260px] relative">
          {isSuccess ? (
            <div className="flex flex-col items-center text-center p-4 animate-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-3 border border-green-500/30">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-green-500 flex items-center gap-1.5">
                <PartyPopper className="w-5 h-5" /> WhatsApp Linked Successfully!
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{connectedOwner}</p>
              <span className="text-[11px] text-muted-foreground mt-3 bg-muted px-3 py-1 rounded-full border border-border">
                Closing window and refreshing devices...
              </span>
            </div>
          ) : loading && !qrCode && !isDemoMode ? (
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Connecting to WhatsApp Server...</p>
              <p className="text-xs text-muted-foreground">Generating real QR Code...</p>
            </div>
          ) : qrCode ? (
            <div className="flex flex-col items-center">
              <div className="bg-white p-3 rounded-xl shadow-md border border-gray-200 mb-3">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-52 h-52 object-contain" />
              </div>
              {pairingCode && (
                <div className="text-xs bg-muted px-3 py-1.5 rounded-full text-muted-foreground border border-border">
                  Pairing Code: <span className="font-mono font-bold text-foreground">{pairingCode}</span>
                </div>
              )}
            </div>
          ) : isDemoMode ? (
            <div className="flex flex-col items-center text-center p-2">
              <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-3">
                <WifiOff className="w-3.5 h-3.5" /> Backend Server Offline (Demo Mode)
              </div>
              <button
                onClick={loadQR}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retry Connection
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Waiting for QR Code...</p>
            </div>
          )}
        </div>

        <div className="mt-5 text-xs text-muted-foreground space-y-2 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary shrink-0" />
            <span>Open WhatsApp on your phone {'>'} Linked Devices</span>
          </div>
          <p>Tap "Link a Device" and scan the QR code displayed above.</p>
        </div>
      </div>
    </div>
  );
}

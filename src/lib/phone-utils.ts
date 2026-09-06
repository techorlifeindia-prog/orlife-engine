/**
 * Formats raw phone numbers or WhatsApp JIDs into clean international format.
 * Examples:
 * - "9876543210" -> "+91 98765 43210"
 * - "919876543210@s.whatsapp.net" -> "+91 98765 43210"
 * - "+919876543210" -> "+91 98765 43210"
 */
export function formatPhoneNumber(rawPhone: string): string {
  if (!rawPhone) return "";

  // Extract clean number before @ if JID
  const cleanStr = rawPhone.split("@")[0].trim();
  const digits = cleanStr.replace(/\D/g, "");

  if (!digits) return rawPhone;

  // 10-digit Indian Mobile Number
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  // 12-digit Indian Mobile Number starting with 91
  if (digits.length === 12 && digits.startsWith("91")) {
    const num = digits.slice(2);
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }

  // 11-digit or non-standard 91 prefix
  if (digits.startsWith("91") && digits.length >= 11) {
    const num = digits.slice(2);
    if (num.length === 10) {
      return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
    }
  }

  // Fallback: +<digits>
  return `+${digits}`;
}

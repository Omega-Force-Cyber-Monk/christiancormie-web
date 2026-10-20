import bulb from "@/features/vendor/assets/earnings/bitedrops-credits-modal-bulb.webp";
import growth from "@/features/vendor/assets/earnings/bitedrops-credits-modal-growth.webp";
import sparkles from "@/features/vendor/assets/earnings/bitedrops-credits-modal-sparkles.webp";
import target from "@/features/vendor/assets/earnings/bitedrops-credits-modal-target.webp";
import repeat from "@/features/vendor/assets/earnings/bitedrops-credits-modal-repeat.webp";
import lightning from "@/features/vendor/assets/earnings/bitedrops-credits-modal-lightning.webp";
import clipboard from "@/features/vendor/assets/earnings/bitedrops-credits-modal-clipboard.webp";
import search from "@/features/vendor/assets/earnings/bitedrops-credits-modal-search.webp";
import keyboard from "@/features/vendor/assets/earnings/bitedrops-credits-modal-keyboard.webp";
import phone from "@/features/vendor/assets/earnings/bitedrops-credits-modal-phone.webp";
export const creditArtwork = {
  bulb,
  growth,
  sparkles,
  target,
  repeat,
  lightning,
  clipboard,
  search,
  keyboard,
  phone,
};
export type EarningsTransaction = {
  id: string;
  name: string;
  status: "processing" | "completed";
  amountCents: number;
  date: string;
  transactionId?: string;
};
export const earningsTransactions: EarningsTransaction[] = [
  {
    id: "payout-1",
    name: "Payout Request",
    status: "processing",
    amountCents: 17300,
    date: "Apr 12, 2026",
    transactionId: "294785",
  },
  {
    id: "payment-1",
    name: "Michael Chen",
    status: "completed",
    amountCents: 9500,
    date: "Apr 11, 2026",
  },
  {
    id: "payment-2",
    name: "Michael Chen",
    status: "completed",
    amountCents: 9500,
    date: "Apr 11, 2026",
  },
  {
    id: "payout-2",
    name: "Payout Request",
    status: "processing",
    amountCents: 17300,
    date: "Apr 12, 2026",
    transactionId: "294785",
  },
  {
    id: "payment-3",
    name: "Michael Chen",
    status: "completed",
    amountCents: 9500,
    date: "Apr 11, 2026",
  },
  {
    id: "payment-4",
    name: "Michael Chen",
    status: "completed",
    amountCents: 9500,
    date: "Apr 11, 2026",
  },
];
// Daily points are local illustrations inferred from chart geometry, totaling the source's 585.
export const qrScanData = [
  { label: "Mon", value: 45 },
  { label: "Tue", value: 62 },
  { label: "Wed", value: 38 },
  { label: "Thu", value: 92 },
  { label: "Fri", value: 74 },
  { label: "Sat", value: 120 },
  { label: "Sun", value: 154 },
];
export const followerData = [
  { label: "W1", value: 980 },
  { label: "W2", value: 1055 },
  { label: "W3", value: 1130 },
  { label: "W4", value: 1240 },
];
export const topDropLocations = [
  { id: "mission", name: "4th & Mission, SF", scans: 156 },
  { id: "castro-1", name: "Castro District, SF", scans: 98 },
  { id: "castro-2", name: "Castro District, SF", scans: 98 },
  { id: "soma", name: "SoMa, San Francisco", scans: 74 },
];
export const creditRedemptions = [
  {
    id: "maria",
    name: "Maria Chen",
    method: "QR Scan",
    time: "Today, 2:14 PM",
    amountCents: 500,
  },
  {
    id: "jake",
    name: "Jake Torres",
    method: "Manual Code",
    time: "Today, 11:08 AM",
    amountCents: 500,
  },
  {
    id: "anya",
    name: "Anya Patel",
    method: "QR Scan",
    time: "Yesterday, 6:42 PM",
    amountCents: 500,
  },
  {
    id: "leo",
    name: "Leo Kim",
    method: "QR Scan",
    time: "Yesterday, 1:17 PM",
    amountCents: 500,
  },
  {
    id: "sara",
    name: "Sara Johnson",
    method: "Self-Service",
    time: "May 20, 7:33 PM",
    amountCents: 500,
  },
];
export const creditSummary = {
  total: 125,
  appliedCents: 62500,
  averagePerDay: 17.9,
  weeklyChange: 18,
};

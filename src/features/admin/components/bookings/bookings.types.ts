import type { AdminBookingDto } from "@/features/admin/types/admin.dto";
export type BookingRecord = {
  id: string;
  displayId: string;
  source: AdminBookingDto;
  customerName: string;
  vendorName: string;
  date: string;
  location: string;
  amount: string;
  fee: string;
  paymentModel: string;
  pricingModel: string;
  status: string;
  badgeCount?: number;
};

export type MessageRecipient = {
  name: string;
  type: "customer" | "vendor";
  conversationId: string;
};

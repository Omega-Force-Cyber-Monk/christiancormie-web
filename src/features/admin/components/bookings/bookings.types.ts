export type BookingRecord = {
  id: string;
  customerName: string;
  vendorName: string;
  date: string;
  location: string;
  amount: string;
  fee: string;
  paymentModel: "Prepaid" | "Deposit";
  pricingModel: "Per person" | "Flat fee";
  status: "confirmed" | "pending" | "ongoing" | "disputed";
  badgeCount?: number;
};

export type MessageRecipient = {
  name: string;
  type: "customer" | "vendor";
  conversationId: string;
};

import type { BookingRecord } from "@/features/admin/components/bookings/bookings.types";

export const getBookingStatusBadge = (status: BookingRecord["status"]) => {
  switch (status) {
    case "confirmed":
      return (
        <span className="inline-block rounded-full border border-[#14535e]/60 bg-[#0c2e32]/70 px-3 py-1 text-[11px] font-medium text-[#2dd4bf]">
          confirmed
        </span>
      );
    case "pending":
      return (
        <span className="inline-block rounded-full border border-[#713f12]/60 bg-[#2c2410]/70 px-3 py-1 text-[11px] font-medium text-[#eab308]">
          pending
        </span>
      );
    case "ongoing":
      return (
        <span className="inline-block rounded-full border border-[#0369a1]/60 bg-[#0c2538]/70 px-3 py-1 text-[11px] font-medium text-[#38bdf8]">
          ongoing
        </span>
      );
    case "disputed":
      return (
        <span className="inline-block rounded-full border border-[#991b1b]/60 bg-[#381418]/70 px-3 py-1 text-[11px] font-medium text-[#f87171]">
          disputed
        </span>
      );
  }
};

export const getPaymentModelBadge = (model: BookingRecord["paymentModel"]) => {
  if (model === "Prepaid") {
    return (
      <span className="inline-block rounded-full border border-[#14535e]/60 bg-[#0c2e32]/70 px-3 py-1 text-[11px] font-medium text-[#2dd4bf]">
        Prepaid
      </span>
    );
  }

  return (
    <span className="inline-block rounded-full border border-[#713f12]/60 bg-[#2c2410]/70 px-3 py-1 text-[11px] font-medium text-[#eab308]">
      Deposit
    </span>
  );
};

import { toAdminBookingDetails } from "@/features/admin/utils/adminBookings";
import {
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  Phone,
  Truck,
  User,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import { Modal } from "@/components/overlays/Modal/Modal";
import type {
  BookingRecord,
  MessageRecipient,
} from "@/features/admin/components/bookings/bookings.types";

type BookingDetailsModalProps = {
  booking?: BookingRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenMessage: (recipient: MessageRecipient) => void;
};

export function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onOpenMessage,
}: BookingDetailsModalProps) {
  const details = toAdminBookingDetails(booking);

  return (
    <Modal
      backdropClassName="bg-black/75 backdrop-blur-sm"
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="relative my-8 flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#1e2638] bg-[#141a27] text-slate-200 shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6542]"
      showCloseButton={false}
      titleId="booking-details-title"
    >
      {!details ? (
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-white">Booking not found</h2>
          <p className="mt-2 text-sm text-[#8091a7]">
            The selected booking is null or no longer available.
          </p>
          <button
            className="mt-5 rounded-xl bg-[#ff6542] px-4 py-2 text-sm font-semibold text-white"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between border-b border-[#1e2638] bg-[#111726]/90 p-6">
            <div>
              <h2 className="text-xl font-bold text-white" id="booking-details-title">
                Booking Details
              </h2>
              <p className="mt-0.5 text-xs text-[#64748b]">ID: {details.id}</p>
            </div>
            <button
              className="cursor-pointer rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[#1e2638] hover:text-white"
              onClick={onClose}
              type="button"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="max-h-[80vh] space-y-5 overflow-y-auto p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-block rounded-full border border-[#14535e] bg-[#0c2e32]/80 px-3.5 py-1 text-xs font-semibold text-[#2dd4bf] capitalize">
                {details.status}
              </span>
              <div className="flex items-center gap-2.5">
                <button className="cursor-pointer rounded-xl border border-[#26334a] bg-[#182030] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-[#222d44]">
                  Return payment
                </button>
                <button className="cursor-pointer rounded-xl bg-[#ff6542] px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-[#ff5530]">
                  Release payment
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <PartyCard
                accent="customer"
                email={details.customerEmail}
                name={details.customerName}
                onMessage={() =>
                  onOpenMessage({
                    name: details.customerName,
                    type: "customer",
                    conversationId: `${details.id}-customer`,
                  })
                }
                phone={details.customerPhone}
                title="Customer Information"
              />
              <PartyCard
                accent="vendor"
                email={details.vendorEmail}
                name={details.vendorName}
                nameLabel="Business Name"
                onMessage={() =>
                  onOpenMessage({
                    name: details.vendorName,
                    type: "vendor",
                    conversationId: `${details.id}-vendor`,
                  })
                }
                phone={details.vendorPhone}
                title="Vendor Information"
              />
            </div>

            <div className="space-y-3 rounded-xl border border-[#2e3443] bg-[#171e30] p-4">
              <h3 className="text-sm font-semibold text-white">Event Details</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <DetailItem label="Event Type" value={details.eventType} />
                <DetailItem label="Guest Count" value={details.guestCount} />
                <DetailItem
                  icon={<Calendar className="size-3.5 text-[#64748b]" />}
                  label="Event Date"
                  value={details.eventDate}
                />
                <DetailItem
                  icon={<Clock className="size-3.5 text-[#64748b]" />}
                  label="Event Time"
                  value={details.eventTime}
                />
              </div>
              <div className="space-y-2 border-t border-[#1e2638]/60 pt-2 text-xs">
                <div>
                  <span className="block text-[11px] text-[#64748b]">Location</span>
                  <div className="mt-0.5 flex items-start gap-1.5 text-slate-200">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#64748b]" />
                    <div>
                      <span className="block font-semibold">{details.location}</span>
                      <span className="block text-[11px] text-[#64748b]">
                        {details.address}
                      </span>
                    </div>
                  </div>
                </div>
                <DetailItem label="Special Requests" value={details.specialRequests} />
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-[#2e3443] bg-[#171e30] p-4">
              <h3 className="text-sm font-semibold text-white">Payment Information</h3>
              <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                <PaymentBox label="Payment model" value={details.paymentModel} />
                <PaymentBox muted label="Pricing model" value={details.pricingModel} />
              </div>
              <div className="space-y-2.5 border-t border-[#1e2638]/60 pt-1 text-xs">
                <PaymentRow label="Total amount" strong value={details.totalAmount} />
                <PaymentRow label="Payment amount" value={details.paymentAmount} />
                <PaymentRow
                  label="Commission gross amount"
                  value={details.commissionGross}
                />
                <PaymentRow
                  danger
                  label={
                    booking?.source.payment?.commission
                      ? `Commission (${new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 4 }).format(booking.source.payment.commission.commissionRate)})`
                      : "Commission"
                  }
                  value={details.commission}
                />
                <PaymentRow label="Vendor payout" strong value={details.vendorPayout} />
                <div className="flex justify-end pt-2">
                  <span className="rounded-full border border-[#14535e] bg-[#0c2e32]/80 px-3 py-1 text-xs font-semibold text-[#2dd4bf]">
                    {booking?.source.payment?.status ?? "No payment recorded"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

function PartyCard({
  accent,
  email,
  name,
  nameLabel = "Name",
  onMessage,
  phone,
  title,
}: {
  accent: "customer" | "vendor";
  email: string;
  name: string;
  nameLabel?: string;
  onMessage: () => void;
  phone: string;
  title: string;
}) {
  const Icon = accent === "customer" ? User : Truck;
  const accentClass = accent === "customer" ? "text-[#2dd4bf]" : "text-[#ff6542]";
  const messageClass =
    accent === "customer"
      ? "bg-[#2dd4bf] text-[#0f172a] hover:bg-[#14b8a6]"
      : "bg-[#ff6542] text-white hover:bg-[#ff5530]";

  return (
    <div className="space-y-3 rounded-xl border border-[#2e3443] bg-[#171e30] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Icon className={`size-4 ${accentClass}`} />
        <span>{title}</span>
      </div>
      <div className="space-y-1 text-xs">
        <DetailItem label={nameLabel} strong value={name} />
        <DetailItem label="Email" value={email} />
        <DetailItem label="Phone" value={phone} />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold shadow-sm transition ${messageClass}`}
          onClick={onMessage}
          type="button"
        >
          <MessageSquare className="size-3.5" />
          <span>Message</span>
        </button>
        <button
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#10b981] py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#059669]"
          type="button"
        >
          <Phone className="size-3.5" />
          <span>Call</span>
        </button>
      </div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  strong = false,
  value,
}: {
  icon?: ReactNode;
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div>
      <span className="block text-[11px] text-[#64748b]">{label}</span>
      <div className="mt-0.5 flex items-center gap-1.5 text-slate-200">
        {icon}
        <span className={strong ? "font-semibold text-slate-100" : "font-medium"}>
          {value}
        </span>
      </div>
    </div>
  );
}

function PaymentBox({
  label,
  muted = false,
  value,
}: {
  label: string;
  muted?: boolean;
  value: string;
}) {
  return (
    <div>
      <span className="mb-1 block text-[11px] text-[#64748b]">{label}</span>
      <div
        className={
          muted
            ? "rounded-lg border border-[#232d42] bg-[#182030] px-3.5 py-2 font-medium text-slate-300"
            : "rounded-lg border border-[#14535e] bg-[#0c2e32]/80 px-3.5 py-2 font-medium text-[#2dd4bf]"
        }
      >
        {value}
      </div>
    </div>
  );
}

function PaymentRow({
  danger = false,
  label,
  strong = false,
  value,
}: {
  danger?: boolean;
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#64748b]">{label}</span>
      <span
        className={
          danger
            ? "font-semibold text-[#f87171]"
            : strong
              ? "text-sm font-bold text-white"
              : "text-slate-200"
        }
      >
        {value}
      </span>
    </div>
  );
}

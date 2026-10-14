import { Calendar, CreditCard, Eye, MapPin, Truck, User } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/data-display/DataTable/DataTable";
import type { DataTableColumn } from "@/components/data-display/DataTable/data-table.types";
import { ErrorState } from "@/components/states/ErrorState";
import { useGetAdminBookingsManagementQuery } from "@/features/admin/api/admin.api";
import { AdminLoading } from "@/features/admin/components/AdminLoading";
import { BookingDetailsModal } from "@/features/admin/components/bookings/BookingDetailsModal";
import { BookingMessageModal } from "@/features/admin/components/bookings/BookingMessageModal";
import { BookingSummaryCards } from "@/features/admin/components/bookings/BookingSummaryCards";
import {
  getBookingStatusBadge,
  getPaymentModelBadge,
} from "@/features/admin/components/bookings/bookingBadges";
import type {
  BookingRecord,
  MessageRecipient,
} from "@/features/admin/components/bookings/bookings.types";
import {
  formatCurrency,
  formatDate,
  formatNumber,
} from "@/features/admin/utils/adminFormat";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

const pageSize = 5;

const columns: DataTableColumn<BookingRecord>[] = [
  {
    id: "id",
    header: "Booking ID",
    accessor: (booking) => (
      <span className="text-sm font-semibold text-slate-100">{booking.id}</span>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    accessor: (booking) => (
      <div className="flex items-center gap-2.5">
        <User className="size-4 shrink-0 text-[#f95738]" />
        <span className="text-sm font-normal whitespace-nowrap text-slate-200">
          {booking.customerName}
        </span>
      </div>
    ),
  },
  {
    id: "vendor",
    header: "Vendor",
    accessor: (booking) => (
      <div className="flex items-center gap-2.5">
        <Truck className="size-4 shrink-0 text-[#2dd4bf]" />
        <span className="text-sm font-normal whitespace-nowrap text-slate-200">
          {booking.vendorName}
        </span>
      </div>
    ),
  },
  {
    id: "date",
    header: "Date",
    accessor: (booking) => (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap text-slate-300">
          <Calendar className="size-3.5 shrink-0 text-[#64748b]" />
          <span>{booking.date}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap text-[#64748b]">
          <MapPin className="size-3.5 shrink-0 text-[#64748b]" />
          <span>{booking.location}</span>
        </div>
      </div>
    ),
  },
  {
    id: "amount",
    header: "Amount",
    accessor: (booking) => (
      <div>
        <div className="text-sm font-semibold whitespace-nowrap text-slate-100">
          {booking.amount}
        </div>
        <div className="text-xs whitespace-nowrap text-[#64748b]">
          Fee: {booking.fee}
        </div>
      </div>
    ),
  },
  {
    id: "paymentModel",
    header: "Payment Model",
    accessor: (booking) => getPaymentModelBadge(booking.paymentModel),
  },
  {
    id: "pricingModel",
    header: "Pricing Model",
    accessor: (booking) => (
      <span className="inline-block rounded-full border border-[#2b374e] bg-[#1a2334] px-3.5 py-1 text-[11px] font-medium whitespace-nowrap text-[#94a3b8]">
        {booking.pricingModel}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessor: (booking) => getBookingStatusBadge(booking.status),
  },
];

const toBookingStatus = (status: string): BookingRecord["status"] => {
  const normalized = status.toLowerCase();
  if (
    normalized === "confirmed" ||
    normalized === "pending" ||
    normalized === "ongoing" ||
    normalized === "disputed"
  ) {
    return normalized;
  }

  return "pending";
};

export default function AdminBookingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [messageRecipient, setMessageRecipient] = useState<MessageRecipient>({
    name: "N/A",
    type: "customer",
    conversationId: "N/A",
  });
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const { data, error, isError, isLoading, refetch } =
    useGetAdminBookingsManagementQuery();

  const bookings: BookingRecord[] = useMemo(
    () =>
      data?.bookings.map((booking) => ({
        id: booking.bookingNumber,
        customerName: booking.customer.name,
        vendorName: booking.vendor.name,
        date: formatDate(booking.event.date),
        location: booking.event.location,
        amount: formatCurrency(booking.payment?.totalAmount),
        fee: formatCurrency(booking.payment?.commissionAmount),
        paymentModel:
          booking.payment?.paymentModel === "PREPAID" ? "Prepaid" : "Deposit",
        pricingModel:
          booking.payment?.pricingModel === "PER_PERSON" ? "Per person" : "Flat fee",
        status: toBookingStatus(booking.status),
        badgeCount: booking.actions?.canViewDetails ? 1 : undefined,
      })) ?? [],
    [data?.bookings],
  );

  const filteredBookings = useMemo(() => {
    const term = search.toLowerCase();
    return bookings.filter(
      (booking) =>
        booking.id.toLowerCase().includes(term) ||
        booking.customerName.toLowerCase().includes(term) ||
        booking.vendorName.toLowerCase().includes(term) ||
        booking.location.toLowerCase().includes(term) ||
        booking.status.toLowerCase().includes(term),
    );
  }, [bookings, search]);

  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1;
  const validPage = Math.min(Math.max(1, page), totalPages);
  const paginatedBookings = filteredBookings.slice(
    (validPage - 1) * pageSize,
    validPage * pageSize,
  );

  const summaryCards = data
    ? [
        {
          title: "Total Bookings",
          amount: formatNumber(data.summary.totalBookings),
        },
        { title: "This Month", amount: formatNumber(data.summary.thisMonth) },
        {
          title: "Total Revenue",
          amount: formatCurrency(data.summary.totalRevenue),
        },
        {
          title: "Pending Payment Release",
          amount: formatNumber(data.summary.pendingPaymentRelease),
          icon: <CreditCard className="size-5 text-orange-500" />,
        },
        { title: "Disputed", amount: formatNumber(data.summary.disputed) },
      ]
    : undefined;

  if (isLoading) {
    return <AdminLoading cards={5} rows={5} />;
  }

  if (isError && !data) {
    return (
      <ErrorState
        error={normalizeApiError(error)}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="View and manage all platform bookings"
        title="Bookings Management"
      />

      <div className="rounded-lg bg-[#1E293B] p-6">
        <div className="flex items-center gap-4">
          <CreditCard className="size-5 text-orange-500" />
          <div>
            <h2 className="font-semibold text-white">Payment Release</h2>
            <p className="text-sm text-slate-300">
              You can manually release payments for completed bookings if the customer
              forgets to approve the completion request. This ensures vendors receive
              their earnings promptly.
            </p>
          </div>
        </div>
      </div>

      <div>
        {isError ? <ErrorState error={normalizeApiError(error)} /> : null}
        <BookingSummaryCards data={summaryCards} />
      </div>

      <DataTable
        columns={columns}
        data={paginatedBookings}
        emptyMessage={
          search ? `No bookings found matching "${search}"` : "No bookings found"
        }
        getRowId={(booking) => booking.id}
        pagination={{
          page: validPage,
          pageSize,
          totalItems: filteredBookings.length,
          onPageChange: setPage,
          onPageSizeChange: () => setPage(1),
          showPageNumbers: true,
          showPageSizeSelector: false,
          showResultRange: true,
        }}
        rowActions={(booking) => (
          <div className="flex justify-center">
            <button
              className="relative inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#ff6b4a] px-4 py-2 text-xs font-semibold whitespace-nowrap text-white shadow-sm transition active:scale-95 hover:bg-[#ff5530]"
              onClick={() => setSelectedBooking(booking)}
              type="button"
            >
              <Eye className="size-3.5 shrink-0" />
              <span>Booking details</span>
              {booking.badgeCount !== undefined ? (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 border-[#141a27] bg-[#2dd4bf] text-[10px] font-bold text-[#0f172a] shadow-sm">
                  {booking.badgeCount}
                </span>
              ) : null}
            </button>
          </div>
        )}
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Search bookings...",
        }}
        variant="legacyAdminBookings"
      />

      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        onOpenMessage={(recipient) => {
          setMessageRecipient(recipient);
          setIsMessageOpen(true);
        }}
      />
      <BookingMessageModal
        isOpen={isMessageOpen}
        onClose={() => setIsMessageOpen(false)}
        recipient={messageRecipient}
      />
    </div>
  );
}

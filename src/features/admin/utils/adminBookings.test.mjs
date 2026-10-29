import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { baseApi } from "../../../services/api/baseApi.ts";
import {
  toAdminBooking,
  bookingStart,
  toAdminBookingDetails,
} from "./adminBookings.ts";
import { adminListQuery } from "./adminList.ts";
import {
  getBookingStatusBadge,
  getPaymentModelBadge,
} from "../components/bookings/bookingBadges.tsx";
import AdminBookingsPage from "../pages/AdminBookingsPage.tsx";
import {
  adminTestStore,
  renderAdmin,
  bookingDto,
  bookingsResponse,
} from "./admin.test-fixtures.mjs";

test("booking mapping uses UUID, businessName, actual event and canonical total instead of deposit amount", () => {
  const row = toAdminBooking(bookingDto());
  assert.equal(row.id, bookingDto().id);
  assert.equal(row.displayId, "BK-2026-27");
  assert.equal(row.vendorName, "Real Truck");
  assert.equal(row.location, "123 Actual Street");
  assert.equal(row.amount, "$1,000.25");
  assert.equal(row.fee, "$30.00");
  assert.equal(row.paymentModel, "Deposit");
  assert.equal(row.pricingModel, "Per person");
  assert.equal(row.source.payment.commission.vendorNetAmount, 170);
  assert.match(bookingStart(row.source.event.startsAt).time, /6:30 PM UTC/);
});

test("all actual booking statuses and unknown statuses retain meaning instead of defaulting to pending", () => {
  for (const status of [
    "PENDING",
    "QUOTED",
    "ACCEPTED",
    "PAYMENT_PENDING",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "REJECTED",
    "EXPIRED",
    "FUTURE_STATUS",
  ]) {
    const row = toAdminBooking(bookingDto({ status }));
    assert.equal(row.status, status.toLowerCase().replaceAll("_", " "));
    assert.match(
      renderToStaticMarkup(getBookingStatusBadge(row.status)),
      new RegExp(row.status),
    );
  }
});

test("nullable/missing nested fields and unknown payment models remain safe and distinct from zero", () => {
  for (const missing of [null, undefined]) {
    const row = toAdminBooking(
      bookingDto({
        vendor: missing,
        customer: missing,
        event: missing,
        payment: missing,
        paymentModel: "NO_PREFERENCE",
        pricingModel: null,
      }),
    );
    assert.equal(row.vendorName, "N/A");
    assert.equal(row.customerName, "N/A");
    assert.equal(row.location, "N/A");
    assert.equal(row.fee, "N/A");
    assert.equal(row.pricingModel, "N/A");
    assert.match(row.amount, /currency unavailable/);
    assert.match(
      renderToStaticMarkup(getPaymentModelBadge(row.paymentModel)),
      /no preference/,
    );
  }
  assert.equal(toAdminBooking(bookingDto({ amount: 0 })).amount, "$0.00");
  assert.equal(bookingStart("invalid").time, "N/A");
});

test("bookings render backend values and null payments, and retain contrast table and honest pagination", async () => {
  const store = adminTestStore();
  try {
    await store.dispatch(
      baseApi.util.upsertQueryData(
        "getAdminBookingsManagement",
        adminListQuery(1, 5, {}),
        bookingsResponse([
          bookingDto(),
          bookingDto({
            id: "other-booking",
            bookingNumber: "BK-NO-PAYMENT",
            payment: null,
            vendor: null,
          }),
        ]),
      ),
    );
    const html = renderAdmin(store, AdminBookingsPage);
    assert.match(html, /Real Truck/);
    assert.match(html, /BK-2026-27/);
    assert.match(html, /BK-NO-PAYMENT/);
    assert.match(html, /completed/);
    assert.match(html, /1,000.25/);
    assert.doesNotMatch(html, /Page 1 of|Last page/);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
  }
});

test("booking detail values use real contacts/time/guest count and commission payout without sample prices", () => {
  const details = toAdminBookingDetails(toAdminBooking(bookingDto()));
  assert.equal(details.id, "BK-2026-27");
  assert.equal(details.customerEmail, "customer@example.invalid");
  assert.equal(details.vendorPhone, "+12025550191");
  assert.equal(details.guestCount, "30");
  assert.equal(details.eventTime, "6:30 PM UTC");
  assert.equal(details.address, "123 Actual Street");
  assert.equal(details.pricingModel, "Per person");
  assert.equal(details.vendorPayout, "$170.00");
  assert.equal(details.paymentAmount, "$200.00");
  assert.equal(details.commissionGross, "$200.00");
  assert.equal(toAdminBookingDetails(null), null);
});

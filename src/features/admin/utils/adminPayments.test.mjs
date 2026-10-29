import assert from "node:assert/strict";
import test from "node:test";
import { baseApi } from "../../../services/api/baseApi.ts";
import { adminListQuery } from "./adminList.ts";
import { paymentRows } from "./adminOperations.ts";
import AdminPaymentsPage from "../pages/AdminPaymentsPage.tsx";
import {
  adminTestStore,
  renderAdmin,
  paymentsResponse,
} from "./admin.test-fixtures.mjs";

test("all existing payment tab rows use the real payload including nested methods and revenue months", () => {
  const data = paymentsResponse();
  assert.equal(paymentRows("Payout Requests", data)[0].displayId, "PO-1234");
  assert.equal(paymentRows("Payout Requests", data)[0].value, "$125.50");
  assert.equal(paymentRows("Transaction History", data)[0].name, "Payment Vendor");
  assert.equal(paymentRows("Payment Methods", data)[0].name, "Account Vendor");
  assert.equal(paymentRows("Revenue Overview", data)[0].displayId, "Oct");
  assert.equal(
    paymentRows("Payout Requests", paymentsResponse({ payoutRequests: [] })).length,
    0,
  );
});

test("the payment page displays existing payout data instead of a false empty state", async () => {
  const store = adminTestStore();
  try {
    await store.dispatch(
      baseApi.util.upsertQueryData(
        "getAdminPaymentsManagement",
        adminListQuery(1, 10, {}),
        paymentsResponse(),
      ),
    );
    const html = renderAdmin(store, AdminPaymentsPage);
    assert.match(html, /Payout Vendor/);
    assert.match(html, /PO-1234/);
    assert.doesNotMatch(
      html,
      /No payout requests found|no additional backend row contract/,
    );
  } finally {
    store.dispatch(baseApi.util.resetApiState());
  }
});

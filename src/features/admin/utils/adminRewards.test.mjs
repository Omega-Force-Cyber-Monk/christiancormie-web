import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminOperationalTable } from "../components/AdminOperationalTable.tsx";
import { baseApi } from "../../../services/api/baseApi.ts";
import { rewardRows } from "./adminOperations.ts";
import AdminRewardsPage from "../pages/AdminRewardsPage.tsx";
import {
  adminTestStore,
  renderAdmin,
  rewardsResponse,
} from "./admin.test-fixtures.mjs";

test("reward rows preserve backend rankings, redemption values and user points without inventing empty data", () => {
  const data = rewardsResponse();
  assert.equal(rewardRows("Leaderboard", data)[0].name, "Ranked Truck");
  assert.equal(rewardRows("Redeem Transactions", data)[0].displayId, "RDM-1234");
  assert.equal(rewardRows("Redeem Transactions", data)[0].value, "-100 points");
  assert.equal(rewardRows("Top Users", data)[0].name, "Top User");
  assert.equal(rewardRows("Top Users", data)[0].status, "Explorer");
  assert.match(
    renderToStaticMarkup(
      createElement(AdminOperationalTable, {
        rows: rewardRows("Top Users", data),
        emptyMessage: "Empty",
      }),
    ),
    /Explorer/,
  );
  assert.equal(rewardRows("Top Users", data)[0].value, "500 lifetime points");
  assert.equal(
    rewardRows("Leaderboard", rewardsResponse({ leaderboard: [] })).length,
    0,
  );
});

test("the rewards page renders actual leaderboard rows rather than a false empty state", async () => {
  const store = adminTestStore();
  try {
    await store.dispatch(
      baseApi.util.upsertQueryData(
        "getAdminRewardsManagement",
        { limit: 100 },
        rewardsResponse(),
      ),
    );
    const html = renderAdmin(store, AdminRewardsPage);
    assert.match(html, /Ranked Truck/);
    assert.match(html, /500 points/);
    assert.doesNotMatch(
      html,
      /No leaderboard found|no additional backend row contract/,
    );
  } finally {
    store.dispatch(baseApi.util.resetApiState());
  }
});

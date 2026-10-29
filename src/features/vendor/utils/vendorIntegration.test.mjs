import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { baseApi } from "../../../services/api/baseApi.ts";
import { vendorApi } from "../api/vendor.api.ts";
import {
  vendorProfileSchema,
  vendorTrucksSchema,
  vendorAnalyticsSchema,
} from "../schemas/vendor.schema.ts";
import {
  toVendorIdentity,
  toVendorBooking,
  vendorContextMatches,
  vendorNumber,
  vendorAmount,
} from "./vendorAdapters.ts";
import { toVendorQr, vendorResourceUrl, shareVendorQr } from "./vendorQr.ts";
import VendorDashboardPage from "../pages/VendorDashboardPage.tsx";
import VendorHomeLayout from "../components/home/VendorHomeLayout.tsx";
import { VendorAnalyticsPanel } from "../components/home/VendorAnalyticsPanel.tsx";
import { VendorQrPanel } from "../components/home/VendorQrPanel.tsx";
import {
  clearSession,
  sessionStarted,
  identityVerified,
} from "../../auth/store/auth.slice.ts";
import {
  ownerId,
  vendorId,
  truckId,
  profileDto,
  truckDto,
  analyticsDto,
  recentBookingDto,
  countsDto,
  qrDto,
  vendorTestStore,
  seedVendorHome,
  json,
} from "./vendor.test-fixtures.mjs";

const render = (store, component = VendorDashboardPage) =>
  renderToStaticMarkup(
    createElement(
      Provider,
      { store },
      createElement(
        MemoryRouter,
        { initialEntries: ["/dashboard/vendor"] },
        createElement(component),
      ),
    ),
  );
const parsedProfile = () => vendorProfileSchema.parse(profileDto());
const parsedTrucks = (rows = [truckDto()]) => vendorTrucksSchema.parse(rows);

for (const [endpoint, path, body] of [
  ["getVendorMe", "/vendors/me", profileDto()],
  ["getMyTrucks", "/food-trucks/mine", [truckDto()]],
  ["getVendorAnalytics", "/vendors/me/analytics", analyticsDto()],
  ["getVendorRequestCounts", "/bookings/vendor/requests/counts", countsDto()],
  ["getVendorQr", "/vendors/me/qr-code", qrDto()],
]) {
  test(`${endpoint} uses the exact authenticated GET contract and correct envelope`, async () => {
    const store = vendorTestStore();
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async (request) => {
      calls++;
      assert.equal(new URL(request.url).pathname, `/api/v1${path}`);
      assert.equal(new URL(request.url).search, "");
      assert.equal(request.method, "GET");
      assert.equal(request.headers.get("authorization"), "Bearer test-access");
      assert.equal(request.headers.get("accept"), "application/json");
      return json(body);
    };
    const request = store.dispatch(vendorApi.endpoints[endpoint].initiate());
    try {
      const data = await request.unwrap();
      assert.equal(calls, 1);
      if (endpoint === "getVendorMe") {
        assert.deepEqual(data.user, { status: "ACTIVE" });
        assert.doesNotMatch(
          JSON.stringify(store.getState().api),
          /test-sensitive-field-not-for-cache|passwordHash/,
        );
      }
      if (endpoint === "getMyTrucks") assert.equal(data[0].id, truckId);
      if (endpoint === "getVendorAnalytics")
        assert.equal(data.recentBookings[0].totalAmount, "1234.56");
      if (endpoint === "getVendorRequestCounts") assert.deepEqual(data, countsDto());
      if (endpoint === "getVendorQr") assert.equal(data.foodTruckId, truckId);
    } finally {
      request.unsubscribe();
      globalThis.fetch = original;
      store.dispatch(baseApi.util.resetApiState());
    }
  });
}

test("vendor, food truck UUIDs and public slugs remain distinct for zero, one and multiple trucks", () => {
  const profile = parsedProfile();
  for (const trucks of [
    [],
    [truckDto()],
    [
      truckDto(),
      truckDto({
        id: "second-truck-uuid",
        slug: "second-public-slug",
        name: "Second Truck",
      }),
    ],
  ]) {
    const identity = toVendorIdentity(profile, parsedTrucks(trucks));
    assert.equal(identity.vendorId, vendorId);
    assert.equal(identity.ownerId, ownerId);
    assert.equal(identity.trucks.length, trucks.length);
    for (const [index, row] of identity.trucks.entries()) {
      assert.equal(row.foodTruckId, trucks[index].id);
      assert.equal(row.publicSlug, trucks[index].slug);
      assert.notEqual(row.foodTruckId, row.publicSlug);
    }
  }
  assert.equal(vendorContextMatches(profile, "different-owner", parsedTrucks()), false);
  assert.equal(
    vendorContextMatches(
      profile,
      ownerId,
      parsedTrucks([truckDto({ vendorId: "other-vendor" })]),
    ),
    false,
  );
  assert.equal(
    toVendorIdentity(
      { ...profile, logoUrl: null, market: null },
      parsedTrucks([
        truckDto({ profileImageUrl: "https://example.invalid/one.png" }),
        truckDto({ id: "two", profileImageUrl: "https://example.invalid/two.png" }),
      ]),
    ).imageUrl,
    null,
  );
});

test("analytics mapping preserves actual amounts, request count meaning, nullable fields and UTC start times", () => {
  const booking = toVendorBooking(recentBookingDto());
  assert.equal(booking.id, recentBookingDto().id);
  assert.equal(booking.displayId, "BK-2026-0007");
  assert.equal(booking.foodTruckId, truckId);
  assert.equal(booking.publicSlug, "actual-food-truck");
  assert.equal(booking.customer, "Actual Customer");
  assert.equal(booking.amount, "1234.56 (currency unavailable)");
  assert.match(booking.when, /UTC/);
  assert.equal(
    vendorAmount("9007199254740993.12"),
    "9007199254740993.12 (currency unavailable)",
  );
  assert.equal(vendorAmount(null), "N/A");
  assert.notEqual(vendorNumber(0), vendorNumber(null));
  const missing = toVendorBooking(
    recentBookingDto({
      startsAt: null,
      totalAmount: null,
      customer: null,
      foodTruck: null,
    }),
  );
  assert.equal(missing.when, "Time unavailable");
  assert.equal(missing.amount, "N/A");
  const html = renderToStaticMarkup(
    createElement(VendorAnalyticsPanel, {
      data: vendorAnalyticsSchema.parse(analyticsDto()),
      counts: countsDto(),
      trucks: parsedTrucks(),
    }),
  );
  for (const text of [
    "Succeeded payment revenue",
    "2,500.25",
    "SUCCEEDED",
    "Actual Food Truck",
    "Active conversations",
    "Community requests",
  ])
    assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /\$|Sample|Hello Taco/);
});

test("connected Home and shell render real vendor identity, counts and recent bookings without fixture data", async () => {
  const store = vendorTestStore();
  try {
    await seedVendorHome(store);
    const body = render(store);
    for (const text of [
      "BK-2026-0007",
      "Actual Customer",
      "Actual Food Truck",
      "COMPLETED",
      "Booking requests: 3",
      "Community requests: 4",
      "Active conversations: 2",
    ])
      assert.ok(body.includes(text), text);
    assert.doesNotMatch(
      body,
      /Corporate Lunch|Google HQ|Block Party|liked your drop|Static Vendor Home/,
    );
    const shell = render(store, VendorHomeLayout);
    assert.match(shell, /Actual Vendor Kitchen/);
    assert.match(shell, /Austin, TX/);
    assert.match(shell, /3 booking requests/);
    assert.doesNotMatch(shell, /Hello Taco|San Francisco|sample count 3/);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
  }
});

for (const status of ["DRAFT", "SUSPENDED", "REJECTED"]) {
  test(`${status} vendor state hides cached analytics and communicates restrictions`, async () => {
    const store = vendorTestStore();
    try {
      await seedVendorHome(store, {
        profile: profileDto({
          status,
          dashboardAccess: {
            allowed: false,
            status: "ONBOARDING_REQUIRED",
            reason: "Complete vendor onboarding to access the vendor dashboard.",
          },
        }),
      });
      const html = render(store);
      assert.match(
        html,
        status === "DRAFT" ? /Vendor onboarding required/ : /Vendor access restricted/,
      );
      assert.doesNotMatch(html, /BK-2026-0007|1234.56/);
    } finally {
      store.dispatch(baseApi.util.resetApiState());
    }
  });
}

for (const status of ["SUSPENDED", "BLOCKED", "DEACTIVATED", "PENDING"]) {
  test(`${status} account restrictions are honored without changing authentication roles`, async () => {
    const store = vendorTestStore();
    try {
      await seedVendorHome(store, { profile: profileDto({ user: { status } }) });
      assert.match(render(store), /Account access restricted/);
      assert.doesNotMatch(render(store), /BK-2026-0007/);
      assert.equal(store.getState().auth.user.role, "VENDOR");
    } finally {
      store.dispatch(baseApi.util.resetApiState());
    }
  });
}

test("optional badge rejection does not block a vendor with dashboard access", async () => {
  const store = vendorTestStore();
  try {
    await seedVendorHome(store, {
      profile: profileDto({
        verificationBadge: {
          isVerified: false,
          status: "REJECTED",
          optional: true,
          message:
            "Verification documents need attention. Dashboard access remains available.",
          rejectionReason: "Unreadable",
        },
      }),
    });
    assert.match(render(store), /BK-2026-0007/);
    assert.doesNotMatch(render(store), /Vendor onboarding required/);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
  }
});

test("empty truck/bookings results and nullable optional metrics never fall back to samples", async () => {
  const store = vendorTestStore();
  try {
    await seedVendorHome(store, {
      trucks: [],
      analytics: analyticsDto({
        totalFoodTrucks: 0,
        totalRevenue: null,
        totalBookings: undefined,
        recentBookings: [],
        paymentSummary: [],
        topTrucks: [],
      }),
      qr: qrDto({ foodTruckId: null, qrCode: null, qrCodeUrl: null }),
    });
    assert.match(render(store), /No food trucks linked/);
    assert.match(render(store), /No recent bookings/);
    assert.doesNotMatch(render(store), /Corporate Lunch|Google HQ/);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
  }
});

test("wrong vendor/truck identities cannot render another context's cached data", async () => {
  const store = vendorTestStore();
  try {
    await seedVendorHome(store, { trucks: [truckDto({ vendorId: "other-vendor" })] });
    assert.match(render(store), /identity does not match/);
    assert.doesNotMatch(render(store), /BK-2026-0007/);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
  }
});

for (const role of ["CUSTOMER", "VENDOR_STAFF", "ADMIN"]) {
  test(`direct component rendering with ${role} never enables vendor reads`, async () => {
    const store = vendorTestStore(role);
    try {
      await seedVendorHome(store);
      assert.match(render(store), /active Vendor role is required/);
      assert.doesNotMatch(render(store), /BK-2026-0007/);
      assert.equal(store.getState().auth.user.role, role);
    } finally {
      store.dispatch(baseApi.util.resetApiState());
    }
  });
}

test("QR data uses actual returned URLs, IDs and independent multiple-truck ownership", () => {
  const profile = parsedProfile();
  const trucks = parsedTrucks([
    truckDto(),
    truckDto({ id: "second", slug: "second-slug" }),
  ]);
  const qr = toVendorQr(
    qrDto({ foodTruckId: "second", downloadUrl: "https://example.invalid/qr.png" }),
    profile,
    trucks,
    "https://api.example.invalid/api/v1",
  );
  assert.equal(qr.foodTruckId, "second");
  assert.equal(qr.imageUrl, "https://example.invalid/qr.png");
  assert.equal(
    qr.shareUrl,
    "https://api.example.invalid/api/v1/qr/truck_backend_confirmed/profile",
  );
  assert.equal(
    toVendorQr(
      qrDto({ vendorId: "other" }),
      profile,
      trucks,
      "https://api.example.invalid/api/v1",
    ).hasCode,
    false,
  );
  assert.equal(
    toVendorQr(
      qrDto({ foodTruckId: "not-owned" }),
      profile,
      trucks,
      "https://api.example.invalid/api/v1",
    ).hasCode,
    false,
  );
  assert.equal(
    vendorResourceUrl("javascript:alert(1)", "https://api.example.invalid/api/v1"),
    null,
  );
  assert.equal(
    vendorResourceUrl("/api/v1/qr/code/profile", "/api", "https://app.example.invalid"),
    "https://app.example.invalid/api/v1/qr/code/profile",
  );
});

test("QR missing image/code disables unsupported UI and never uses the sample SVG", () => {
  const profile = parsedProfile();
  const trucks = parsedTrucks();
  const qr = toVendorQr(
    qrDto({ qrCodeUrl: null }),
    profile,
    trucks,
    "https://api.example.invalid/api/v1",
  );
  const html = renderToStaticMarkup(
    createElement(VendorQrPanel, {
      qr,
      businessName: profile.businessName,
      sharing: false,
      onShare() {},
    }),
  );
  assert.match(html, /QR image unavailable/);
  assert.match(html, /Download unavailable/);
  assert.match(html, /disabled=""/);
  assert.doesNotMatch(html, /<img|QR-code.svg|sample/);
  const present = toVendorQr(
    qrDto({ downloadUrl: "https://example.invalid/real-qr.png" }),
    profile,
    trucks,
    "https://api.example.invalid/api/v1",
  );
  assert.match(
    renderToStaticMarkup(
      createElement(VendorQrPanel, {
        qr: present,
        businessName: profile.businessName,
        sharing: false,
        onShare() {},
      }),
    ),
    /https:\/\/example.invalid\/real-qr.png/,
  );
  const missing = toVendorQr(
    qrDto({ foodTruckId: null, qrCode: null }),
    profile,
    [],
    "https://api.example.invalid/api/v1",
  );
  assert.match(
    renderToStaticMarkup(
      createElement(VendorQrPanel, {
        qr: missing,
        businessName: profile.businessName,
        sharing: false,
        onShare() {},
      }),
    ),
    /No QR information available/,
  );
});

test("actual QR URL sharing supports native share, copy, manual fallback and cancellation", async () => {
  const url = "https://api.example.invalid/api/v1/qr/backend-code/profile";
  let shared;
  assert.equal(
    await shareVendorQr(url, "Real backend message", {
      share: async (data) => {
        shared = data;
      },
    }),
    "shared",
  );
  assert.deepEqual(shared, {
    title: "BiteDrop QR code",
    text: "Real backend message",
    url,
  });
  let copied;
  assert.equal(
    await shareVendorQr(url, "Message", {
      copy: async (value) => {
        copied = value;
      },
    }),
    "copied",
  );
  assert.equal(copied, url);
  assert.equal(await shareVendorQr(url, "Message", {}), "manual");
  let copies = 0;
  const error = new Error("Cancelled");
  error.name = "AbortError";
  assert.equal(
    await shareVendorQr(url, "Message", {
      share: async () => {
        throw error;
      },
      copy: async () => {
        copies++;
      },
    }),
    "cancelled",
  );
  assert.equal(copies, 0);
});

for (const status of [403, 404, 503]) {
  test(`vendor profile ${status} is contextual, retryable and never replaced by sample identity`, async () => {
    const store = vendorTestStore();
    const original = globalThis.fetch;
    let body = json(
      {
        message:
          status === 403
            ? "Vendor access denied"
            : status === 404
              ? "Vendor profile not found"
              : "private database stack",
      },
      status,
    );
    globalThis.fetch = async () => body.clone();
    const request = store.dispatch(vendorApi.endpoints.getVendorMe.initiate());
    try {
      await request;
      const html = render(store);
      assert.match(html, status === 404 ? /Vendor profile unavailable/ : /Retry/);
      assert.doesNotMatch(
        html,
        /Corporate Lunch|Hello Taco|private database stack|BK-2026-0007/,
      );
      body = json(profileDto());
      await request.refetch().unwrap();
      assert.equal(
        vendorApi.endpoints.getVendorMe.select()(store.getState()).data.id,
        vendorId,
      );
      assert.equal(store.getState().auth.user.role, "VENDOR");
    } finally {
      request.unsubscribe();
      globalThis.fetch = original;
      store.dispatch(baseApi.util.resetApiState());
    }
  });
}

test("initial loading and network failures show no fixture data and can retry", async () => {
  const store = vendorTestStore();
  const original = globalThis.fetch;
  try {
    assert.match(render(store), /Loading page/);
    globalThis.fetch = async () => {
      throw new Error("Offline");
    };
    const request = store.dispatch(vendorApi.endpoints.getVendorMe.initiate());
    try {
      await request;
      assert.match(render(store), /Network connection failed/);
      assert.doesNotMatch(render(store), /Corporate Lunch|Hello Taco/);
      globalThis.fetch = async () => json(profileDto());
      await request.refetch().unwrap();
      assert.ok(vendorApi.endpoints.getVendorMe.select()(store.getState()).data);
    } finally {
      request.unsubscribe();
    }
  } finally {
    globalThis.fetch = original;
    store.dispatch(baseApi.util.resetApiState());
  }
});

test("temporary background analytics/profile failures retain good rows while forbidden results hide them", async () => {
  const store = vendorTestStore();
  const original = globalThis.fetch;
  globalThis.fetch = async () => json({ message: "Temporary internal detail" }, 503);
  try {
    await seedVendorHome(store);
    for (const endpoint of ["getVendorMe", "getVendorAnalytics"]) {
      const request = store.dispatch(
        vendorApi.endpoints[endpoint].initiate(undefined, { forceRefetch: true }),
      );
      await request;
      request.unsubscribe();
      assert.match(render(store), /BK-2026-0007/);
      assert.match(render(store), /Retry/);
      assert.doesNotMatch(render(store), /Temporary internal detail/);
    }
    globalThis.fetch = async () => json({ message: "Not allowed" }, 403);
    const request = store.dispatch(
      vendorApi.endpoints.getVendorAnalytics.initiate(undefined, {
        forceRefetch: true,
      }),
    );
    await request;
    request.unsubscribe();
    assert.doesNotMatch(render(store), /BK-2026-0007/);
  } finally {
    globalThis.fetch = original;
    store.dispatch(baseApi.util.resetApiState());
  }
});

test("vendor reads use the shared one-refresh retry and definitive 401 cleanup", async () => {
  for (const valid of [true, false]) {
    const store = vendorTestStore();
    const original = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (request) => {
      const path = new URL(request.url).pathname;
      calls.push(path);
      if (path.endsWith("/auth/refresh"))
        return valid
          ? json({ accessToken: "rotated-access", refreshToken: "rotated-refresh" })
          : json({}, 401);
      return request.headers.get("authorization") === "Bearer rotated-access"
        ? json(profileDto())
        : json({}, 401);
    };
    const request = store.dispatch(vendorApi.endpoints.getVendorMe.initiate());
    try {
      await request;
      assert.equal(calls.filter((path) => path.endsWith("/auth/refresh")).length, 1);
      if (valid) assert.equal(store.getState().auth.accessToken, "rotated-access");
      else {
        assert.equal(store.getState().auth.accessToken, null);
        assert.doesNotMatch(render(store), /BK-2026-0007/);
      }
    } finally {
      request.unsubscribe();
      globalThis.fetch = original;
      store.dispatch(baseApi.util.resetApiState());
    }
  }
});

test("malformed vendor envelopes fail safely instead of silently claiming empty analytics", async () => {
  const store = vendorTestStore();
  const original = globalThis.fetch;
  globalThis.fetch = async () => json({ data: analyticsDto() });
  try {
    for (const endpoint of [
      "getVendorMe",
      "getMyTrucks",
      "getVendorAnalytics",
      "getVendorRequestCounts",
      "getVendorQr",
    ]) {
      const request = store.dispatch(vendorApi.endpoints[endpoint].initiate());
      try {
        await assert.rejects(
          request.unwrap(),
          (error) => error.status === "CUSTOM_ERROR",
        );
      } finally {
        request.unsubscribe();
      }
    }
  } finally {
    globalThis.fetch = original;
    store.dispatch(baseApi.util.resetApiState());
  }
});

for (const replacement of ["logout", "new session"]) {
  test(`late vendor analytics cannot repopulate caches after ${replacement}`, async () => {
    const store = vendorTestStore();
    const original = globalThis.fetch;
    let release;
    let started;
    const ready = new Promise((resolve) => {
      started = resolve;
    });
    globalThis.fetch = async () => {
      started();
      return new Promise((resolve) => {
        release = () => resolve(json(analyticsDto()));
      });
    };
    const request = store.dispatch(vendorApi.endpoints.getVendorAnalytics.initiate());
    try {
      await ready;
      if (replacement === "logout") store.dispatch(clearSession("storage"));
      else {
        store.dispatch(
          sessionStarted({ accessToken: "new-access", refreshToken: "new-refresh" }),
        );
        store.dispatch(
          identityVerified({
            id: "new-owner",
            name: "New Owner",
            email: "new@example.invalid",
            role: "VENDOR",
            roles: ["CUSTOMER", "VENDOR"],
          }),
        );
      }
      release();
      await request;
      assert.equal(
        vendorApi.endpoints.getVendorAnalytics.select()(store.getState()).data,
        undefined,
      );
      assert.doesNotMatch(render(store), /BK-2026-0007/);
      assert.equal(
        store.getState().auth.accessToken,
        replacement === "logout" ? null : "new-access",
      );
    } finally {
      request.unsubscribe();
      globalThis.fetch = original;
      store.dispatch(baseApi.util.resetApiState());
    }
  });
}

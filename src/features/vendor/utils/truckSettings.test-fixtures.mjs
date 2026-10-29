import {
  vendorTestStore,
  seedVendorHome,
  truckDto,
  profileDto,
  ownerId,
  vendorId,
  truckId,
  json,
} from "./vendor.test-fixtures.mjs";
export {
  vendorTestStore,
  seedVendorHome,
  truckDto,
  profileDto,
  ownerId,
  vendorId,
  truckId,
  json,
};
export const cuisineId = "11111111-1111-4111-8111-111111111111";
export const scope = {
  sessionId: "vendor-integration-test",
  userId: ownerId,
  role: "VENDOR",
};
export const fullTruck = (overrides = {}) =>
  truckDto({
    handle: "actual-truck",
    description: "Actual description",
    maximumGuestCapacity: 125,
    operatingHours: [
      {
        dayOfWeek: 1,
        isClosed: false,
        openingTime: "1970-01-01T10:00:00.000Z",
        closingTime: "1970-01-01T18:00:00.000Z",
      },
    ],
    cuisines: [
      {
        cuisineId,
        isPrimary: true,
        cuisine: { id: cuisineId, name: "Actual Cuisine", slug: "actual-cuisine" },
      },
    ],
    ...overrides,
  });

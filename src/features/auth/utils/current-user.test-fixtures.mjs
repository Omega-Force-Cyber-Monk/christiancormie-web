export function currentUserResponse(overrides = {}) {
  return {
    id: "test-user",
    email: "test@example.com",
    phone: null,
    status: "ACTIVE",
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    lastLoginAt: null,
    createdAt: "2026-10-14T00:00:00Z",
    updatedAt: "2026-10-14T00:00:00Z",
    roles: ["ADMIN"],
    profile: null,
    settings: null,
    notificationPreference: null,
    interestCuisines: [],
    vendor: null,
    ...overrides,
  };
}

export function currentUserProfile(overrides = {}) {
  return {
    id: "profile-id",
    userId: "test-user",
    firstName: null,
    lastName: null,
    displayName: null,
    dateOfBirth: null,
    avatarUrl: null,
    bio: null,
    city: null,
    state: null,
    country: null,
    postalCode: null,
    createdAt: "2026-10-14T00:00:00Z",
    updatedAt: "2026-10-14T00:00:00Z",
    ...overrides,
  };
}

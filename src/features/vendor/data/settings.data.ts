export interface VendorSampleStaff {
  id: string;
  email: string;
  addedOn: string;
  pin: string;
  locked: boolean;
}
export const vendorStaffFixtures: readonly VendorSampleStaff[] = [
  {
    id: "maria",
    email: "maria@example.com",
    addedOn: "2026-05-15",
    pin: "1504",
    locked: true,
  },
  {
    id: "jake",
    email: "jake@example.com",
    addedOn: "2026-05-18",
    pin: "5678",
    locked: true,
  },
];
export const vendorSettingsPreviews = {
  pricing: {
    title: "Plan and pricing",
    description:
      "Plan and pricing details are not supplied for this preview. Billing and subscription changes require backend integration.",
  },
  verification: {
    title: "Truck verification",
    description:
      "Truck verification is not connected in this local preview. No verification status has been retrieved or changed.",
  },
  support: {
    title: "Help and support",
    description:
      "Support messaging is not connected in this local preview. You can read the existing Help Center.",
  },
  delete: {
    title: "Delete account preview",
    description:
      "Account deletion requires backend integration. This preview does not delete your account, staff access, or account data.",
  },
} as const;
export type VendorSettingsPreview = keyof typeof vendorSettingsPreviews;

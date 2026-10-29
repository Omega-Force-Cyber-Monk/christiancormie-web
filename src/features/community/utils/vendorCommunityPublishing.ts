import {
  emptyCommunityComposer,
  type CommunityComposerValues,
} from "@/features/customer/schemas/community.schema";
import type {
  GeneralPostValues,
  TruckPostValues,
} from "@/features/vendor/schemas/create-posts.schema";
import type { CommunityCategory } from "../schemas/community.schema";
export const vendorCommunityCategories = {
  NEED_TRUCK: "truck",
  VENDOR_CALLOUT: "callout",
  FOR_SALE: "sale",
  HIRING_JOBS: "jobs",
  COMMUNITY_HELP: "help",
  COMMUNITY: "community",
} as const satisfies Record<CommunityCategory, string>;
const labels = {
  callout: "Callout",
  sale: "For sale",
  jobs: "Hiring / jobs",
  help: "Community help",
  community: "Community",
} as const;
export function vendorGeneralComposer(
  values: GeneralPostValues,
): CommunityComposerValues {
  return {
    ...emptyCommunityComposer,
    category: labels[values.category],
    body: values.description,
    itemName: values.title,
  };
}
export function vendorTruckComposer(values: TruckPostValues): CommunityComposerValues {
  return {
    ...emptyCommunityComposer,
    ...values,
    category: "Need a truck",
    body: values.description,
  };
}

import { sampleMemberProfile } from "@/features/customer/data/member-profile.data";
import { memberProfileEditSchema } from "@/features/customer/schemas/member-profile.schema";

export type MemberProfileTab = "posts" | "tagged";
export const getMemberProfileTab = (value: string | null): MemberProfileTab =>
  value === "tagged" ? "tagged" : "posts";
export type MemberProfileState = {
  name: string;
  following: boolean;
  editing: boolean;
  status: string;
};
export const initialMemberProfileState: MemberProfileState = {
  name: sampleMemberProfile.name,
  following: false,
  editing: false,
  status: "",
};
type MemberProfileAction =
  | { type: "edit" }
  | { type: "cancel" }
  | { type: "follow" }
  | { type: "save"; name: string };
export function memberProfileReducer(
  state: MemberProfileState,
  action: MemberProfileAction,
): MemberProfileState {
  if (action.type === "edit") return { ...state, editing: true };
  if (action.type === "cancel") return { ...state, editing: false };
  if (action.type === "follow")
    return {
      ...state,
      following: !state.following,
      status: state.following
        ? "Unfollowed in this local preview."
        : "Following in this local preview. No account was updated.",
    };
  const result = memberProfileEditSchema.safeParse({ name: action.name });
  if (!result.success) return state;
  return {
    ...state,
    name: result.data.name,
    editing: false,
    status: "Profile name saved locally. No account was updated.",
  };
}
export const getMemberFollowerCount = (following: boolean) =>
  sampleMemberProfile.followers + Number(following);

import { useNavigate, useParams, useSearchParams } from "react-router";
import { useAppSelector } from "@/app/hooks";
import { ROUTES } from "@/constants/routes";
import { isMemberIdentifier } from "@/features/social/utils/profileIdentity";
import CustomerMemberProfilePage from "@/features/customer/pages/CustomerMemberProfilePage";
import { DiscoverProfileView } from "@/features/customer/components/discover/DiscoverProfileView";
export default function CustomerProfilePage() {
  const { id } = useParams();
  const sessionId = useAppSelector((state) => state.auth.sessionId);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab");
  if (isMemberIdentifier(id))
    return (
      <CustomerMemberProfilePage
        key={`${sessionId}:${id}`}
        own={id === "me"}
        userId={id}
      />
    );
  return (
    <DiscoverProfileView
      key={id}
      slug={id ?? ""}
      initialTab={tab === "gallery" || tab === "menu" ? tab : "reviews"}
      onBack={() => void navigate(ROUTES.CUSTOMER_DISCOVER)}
      onTabChange={(next) =>
        setParams(
          (current) => {
            const copy = new URLSearchParams(current);
            copy.set("tab", next);
            return copy;
          },
          { replace: true, preventScrollReset: true },
        )
      }
    />
  );
}

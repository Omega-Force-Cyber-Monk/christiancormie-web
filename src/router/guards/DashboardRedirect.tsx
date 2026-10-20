import { Navigate } from "react-router";

import { useAppSelector } from "@/app/hooks";
import { selectCurrentRole } from "@/features/auth/store/auth.selectors";
import { getRoleHomeRoute } from "@/router/utils/getRoleHomeRoute";

export function DashboardRedirect() {
  const role = useAppSelector(selectCurrentRole);

  return <Navigate replace to={getRoleHomeRoute(role)} />;
}

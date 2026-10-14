import { Outlet } from "react-router";

import { useDocumentTitle } from "@/router/metadata/useDocumentTitle";

export function RouteTitleManager() {
  useDocumentTitle();

  return <Outlet />;
}

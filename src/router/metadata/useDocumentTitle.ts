import { useEffect } from "react";
import { useLocation } from "react-router";

import { appConfig } from "@/config/app.config";
import { getRouteMetadata } from "@/router/metadata/routeMetadata";

export const useDocumentTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const metadata = getRouteMetadata(location.pathname);
    const routeTitle =
      typeof metadata?.title === "function"
        ? metadata.title(location.pathname)
        : metadata?.title;

    document.title = routeTitle ? `${routeTitle} | ${appConfig.name}` : appConfig.name;
  }, [location.pathname]);
};

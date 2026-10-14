import { lazy, Suspense, type ComponentType } from "react";

import { PageLoader } from "@/components/feedback/PageLoader";

type LazyModule = {
  default: ComponentType;
};

export const lazyRoute = (loader: () => Promise<LazyModule>) => {
  const Component = lazy(loader);

  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
};

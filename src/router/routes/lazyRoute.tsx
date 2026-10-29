import { lazy, Suspense, type ComponentType } from "react";

import { AppLoader } from "@/components/ui/AppLoader";

type LazyModule = {
  default: ComponentType;
};

export const lazyRoute = (loader: () => Promise<LazyModule>) => {
  const Component = lazy(loader);

  return (
    <Suspense fallback={<AppLoader />}>
      <Component />
    </Suspense>
  );
};

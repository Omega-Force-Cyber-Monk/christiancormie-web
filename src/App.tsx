import { RouterProvider } from "react-router";
import { Toaster } from "sonner";

import { AppErrorBoundary } from "@/components/errors/AppErrorBoundary";
import { SessionBootstrap } from "@/features/auth/components/SessionBootstrap";
import { router } from "@/router";

export function App() {
  return (
    <AppErrorBoundary>
      <SessionBootstrap>
        <RouterProvider router={router} />
      </SessionBootstrap>
      <Toaster richColors position="top-right" />
    </AppErrorBoundary>
  );
}

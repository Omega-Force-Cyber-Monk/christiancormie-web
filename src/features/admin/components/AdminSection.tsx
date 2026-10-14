import type { PropsWithChildren } from "react";

import { PageHeader } from "@/components/common/PageHeader";

type AdminSectionProps = PropsWithChildren<{
  title: string;
  description: string;
}>;

export function AdminSection({ children, description, title }: AdminSectionProps) {
  return (
    <div className="legacy-admin-page space-y-6">
      <PageHeader description={description} title={title} />
      {children}
    </div>
  );
}

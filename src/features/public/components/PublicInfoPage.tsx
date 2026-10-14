import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

import { ROUTES } from "@/constants/routes";

type PublicInfoPageProps = {
  title: string;
  subtitle: string;
  sections: Array<{
    title: string;
    body: string;
  }>;
};

export function PublicInfoPage({ sections, subtitle, title }: PublicInfoPageProps) {
  const titleParts = title.split(" ");
  const accent = titleParts.pop() ?? title;
  const leadTitle = titleParts.join(" ");

  return (
    <main className="legacy-public-page min-h-dvh bg-black px-6 py-10 text-gray-300 sm:py-16 md:px-20">
      <div className="mx-auto max-w-4xl">
        <Link
          className="mb-8 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-gray-400 transition-all hover:border-orange-400/50 hover:bg-white/10 hover:text-white"
          to={ROUTES.DASHBOARD}
        >
          <ArrowLeft size={16} />
          Back
        </Link>
        <header className="relative mb-12 px-4 pt-2 text-center sm:px-0 sm:pt-8">
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            {leadTitle ? `${leadTitle} ` : null}
            <span>{accent}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
            {subtitle}
          </p>
        </header>
        <div className="space-y-8">
          {sections.map((section) => (
            <section
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-orange-500/30 sm:p-8"
              key={section.title}
            >
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                {section.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-300">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

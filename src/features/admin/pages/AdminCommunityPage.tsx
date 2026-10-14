import { Flag, MessageSquare, ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { useGetAdminCommunityManagementQuery } from "@/features/admin/api/admin.api";
import { AdminDataPanel } from "@/features/admin/components/AdminDataPanel";
import { AdminLoading } from "@/features/admin/components/AdminLoading";
import { AdminSection } from "@/features/admin/components/AdminSection";
import { AdminStatGrid } from "@/features/admin/components/AdminStatGrid";
import { AdminStatusBadge } from "@/features/admin/components/AdminStatusBadge";
import { formatNumber } from "@/features/admin/utils/adminFormat";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

const categoryFilters = [
  "All posts",
  "Need a truck",
  "Vendor callout",
  "For sale",
  "Hiring / jobs",
  "Community help",
  "Community",
];

export default function AdminCommunityPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All posts");
  const { data, error, isError, isLoading, refetch } =
    useGetAdminCommunityManagementQuery({ search: search || undefined });

  const filteredPosts = useMemo(() => {
    const posts = data?.posts ?? [];
    const term = search.toLowerCase().trim();

    return posts.filter((post) => {
      const category = post.category.toLowerCase().replace(/_/g, " ");
      const matchesCategory =
        activeCategory === "All posts" || category === activeCategory.toLowerCase();
      const matchesSearch =
        !term ||
        [
          post.postDisplayId,
          post.author.name,
          post.author.email,
          post.category,
          post.type,
          post.content,
          post.reports[0]?.reason,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, data?.posts, search]);

  if (isLoading) return <AdminLoading />;
  if (isError && !data) {
    return (
      <ErrorState
        error={normalizeApiError(error)}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <AdminSection
      description="Review community posts, reports, and moderation signals."
      title="Community Moderation"
    >
      {isError ? (
        <ErrorState
          error={normalizeApiError(error)}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}
      <AdminStatGrid
        stats={
          data
            ? [
                { label: "Total Posts", value: formatNumber(data.summary.totalPosts) },
                { label: "Today", value: formatNumber(data.summary.today) },
                { label: "Reported", value: formatNumber(data.summary.reported) },
                {
                  label: "Removed Today",
                  value: formatNumber(data.summary.removedToday),
                },
              ]
            : []
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="max-w-md flex-1">
          <span className="sr-only">Search posts</span>
          <input
            className="min-h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search post..."
            type="search"
            value={search}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {categoryFilters.map((category) => (
          <Button
            key={category}
            onClick={() => setActiveCategory(category)}
            variant={activeCategory === category ? "primary" : "secondary"}
          >
            {category}
          </Button>
        ))}
      </div>
      <div className="space-y-4">
        {filteredPosts.length ? (
          filteredPosts.map((post) => (
            <AdminDataPanel key={post.id} title={post.author.name}>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
                  <AdminStatusBadge>{post.type}</AdminStatusBadge>
                  <span>{post.category.replace(/_/g, " ")}</span>
                  {post.reported ? (
                    <span className="inline-flex items-center gap-1 text-[var(--danger)]">
                      <Flag size={14} /> Reported
                    </span>
                  ) : null}
                </div>
                <p className="text-sm leading-6">{post.content}</p>
                <div className="flex gap-4 text-sm text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <ThumbsUp size={14} /> {post.likes}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare size={14} /> {post.commentsCount}
                  </span>
                </div>
                {post.reports[0]?.reason ? (
                  <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-[var(--danger)]">
                    Report reason: {post.reports[0].reason}
                  </p>
                ) : null}
              </div>
            </AdminDataPanel>
          ))
        ) : (
          <EmptyState title="No community posts found" />
        )}
      </div>
    </AdminSection>
  );
}

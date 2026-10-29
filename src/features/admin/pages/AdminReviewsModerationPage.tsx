import { adminPage, useAdminList } from "@/features/admin/utils/adminList";
import { reviewCategory, toAdminReview } from "@/features/admin/utils/adminModeration";
import { DataTablePagination } from "@/components/data-display/DataTable/DataTablePagination";
import { Flag, Star } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { useGetAdminReviewsManagementQuery } from "@/features/admin/api/admin.api";
import { AdminDataPanel } from "@/features/admin/components/AdminDataPanel";
import { AdminLoading } from "@/features/admin/components/AdminLoading";
import { AdminSection } from "@/features/admin/components/AdminSection";
import { AdminStatGrid } from "@/features/admin/components/AdminStatGrid";
import { AdminStatusBadge } from "@/features/admin/components/AdminStatusBadge";
import { formatNumber } from "@/features/admin/utils/adminFormat";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

export default function AdminReviewsModerationPage() {
  const [selectedFilter, setSelectedFilter] = useState("All Reviews");
  const list = useAdminList(10, selectedFilter);
  const {
    currentData: data,
    error,
    isError,
    isLoading,
    isFetching,
    refetch,
  } = useGetAdminReviewsManagementQuery({
    ...list.query,
    category: reviewCategory(selectedFilter),
  });
  const result = adminPage(data?.reviews, list.pageSize);
  const filteredReviews = result.rows.map(toAdminReview);
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
      description="Review customer feedback and reported reviews."
      title="Review Management"
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
                {
                  label: "Total Reviews",
                  value: formatNumber(data.summary.totalReviews),
                },
                { label: "Average Rating", value: data.summary.averageRating },
                { label: "Reported", value: formatNumber(data.summary.reported) },
                {
                  label: "Removed This Week",
                  value: formatNumber(data.summary.removedThisWeek),
                },
              ]
            : []
        }
      />
      <div className="flex flex-wrap justify-end gap-3">
        <input
          aria-label="Search reviews"
          className="min-h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
          type="search"
          placeholder="Search reviews..."
          value={list.search}
          onChange={(event) => list.setSearch(event.target.value)}
        />
        <label>
          <span className="sr-only">Filter reviews</span>
          <select
            className="min-h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
            onChange={(event) => setSelectedFilter(event.target.value)}
            value={selectedFilter}
          >
            {["All Reviews", "Reported only", "Bookings", "Check in"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      {selectedFilter === "Check in" ? (
        <EmptyState
          title="Check-in reviews are unavailable"
          description="The current admin API identifies reviews as bookings and does not expose a check-in review source."
        />
      ) : isFetching && !data ? (
        <AdminLoading cards={0} />
      ) : (
        <div className="space-y-4">
          {filteredReviews.length ? (
            filteredReviews.map((review) => (
              <AdminDataPanel
                key={review.id}
                title={`${review.customerName} to ${review.vendorName}`}
              >
                <div className="space-y-3">
                  <p className="text-xs text-[var(--text-muted)]">{review.displayId}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 text-amber-500">
                      <Star size={16} />{" "}
                      {review.ratingVisible ? review.rating : "Rating hidden"}
                    </span>
                    <AdminStatusBadge>{review.status}</AdminStatusBadge>
                    {review.contentHidden ? (
                      <AdminStatusBadge>Text hidden</AdminStatusBadge>
                    ) : null}
                    {review.reported ? (
                      <span className="inline-flex items-center gap-1 text-[var(--danger)]">
                        <Flag size={14} /> Reported
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-6">{review.content}</p>
                  {review.reportReason ? (
                    <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-[var(--warning)]">
                      Report reason: {review.reportReason}
                    </p>
                  ) : null}
                </div>
              </AdminDataPanel>
            ))
          ) : (
            <EmptyState title="No reviews found" />
          )}
        </div>
      )}
      {selectedFilter !== "Check in" ? (
        <DataTablePagination
          {...list.pagination}
          hasNextPage={result.hasNextPage}
          isFetching={isFetching}
        />
      ) : null}
    </AdminSection>
  );
}

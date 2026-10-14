import { Flag, Star } from "lucide-react";
import { useMemo, useState } from "react";

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
  const category =
    selectedFilter === "Reported only"
      ? "REPORTED"
      : selectedFilter === "Check in"
        ? "CHECK_IN"
        : undefined;
  const { data, error, isError, isLoading, refetch } =
    useGetAdminReviewsManagementQuery({ category });

  const filteredReviews = useMemo(() => {
    const reviews = data?.reviews ?? [];

    return reviews.filter((review) => {
      if (selectedFilter === "Reported only") return review.reported;
      if (selectedFilter === "Bookings") return review.source !== "CHECK_IN";
      if (selectedFilter === "Check in") return review.source === "CHECK_IN";
      return true;
    });
  }, [data?.reviews, selectedFilter]);

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
      <div className="flex justify-end">
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
      <div className="space-y-4">
        {filteredReviews.length ? (
          filteredReviews.map((review) => (
            <AdminDataPanel
              key={review.id}
              title={`${review.customer.name} to ${review.vendor.name}`}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1 text-amber-500">
                    <Star size={16} /> {review.rating}
                  </span>
                  <AdminStatusBadge>{review.status}</AdminStatusBadge>
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
    </AdminSection>
  );
}

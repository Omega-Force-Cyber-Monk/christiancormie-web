import type {
  VendorAnalyticsResponse,
  VendorRequestCountsResponse,
  VendorTrucksResponse,
} from "@/features/vendor/types/vendor.types";
import { vendorAmount, vendorNumber } from "@/features/vendor/utils/vendorAdapters";
import { EmptyState } from "@/components/states/EmptyState";

export function VendorAnalyticsPanel({
  data,
  counts,
  trucks,
}: {
  data?: VendorAnalyticsResponse;
  counts?: VendorRequestCountsResponse;
  trucks?: VendorTrucksResponse;
}) {
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        {[
          ["Food trucks", vendorNumber(data?.totalFoodTrucks)],
          ["Total bookings", vendorNumber(data?.totalBookings)],
          ["Succeeded payment revenue", vendorAmount(data?.totalRevenue)],
          ["Published reviews", vendorNumber(data?.totalReviews)],
          ["Average rating", vendorNumber(data?.averageRating)],
          ["Followers", vendorNumber(data?.totalFollowers)],
          ["Check-ins", vendorNumber(data?.totalCheckIns)],
          ["Booking requests", vendorNumber(counts?.bookings)],
          ["Community requests", vendorNumber(counts?.community)],
          ["Active conversations", vendorNumber(counts?.messages)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-[#B8C1D1]">{label}</dt>
            <dd className="mt-1">{value}</dd>
          </div>
        ))}
      </dl>
      <section>
        <h3 className="mb-2 font-semibold">Payment overview</h3>
        {data?.paymentSummary?.length ? (
          <ul className="space-y-2 text-sm">
            {data.paymentSummary.map((row) => (
              <li key={row.status}>
                {row.status}: {vendorNumber(row.count)} payments;{" "}
                {vendorAmount(row.totalAmount)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#B8C1D1]">No payment summary available.</p>
        )}
      </section>
      <section>
        <h3 className="mb-2 font-semibold">Top food trucks</h3>
        {data?.topTrucks?.length ? (
          <ul className="space-y-2 text-sm">
            {data.topTrucks.map((truck) => (
              <li key={truck.id}>
                {truck.name} - {vendorNumber(truck.totalBookings)} bookings;{" "}
                {vendorNumber(truck.averageRating)} rating
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#B8C1D1]">No top food trucks available.</p>
        )}
      </section>
      <section>
        <h3 className="mb-2 font-semibold">Your food trucks</h3>
        {trucks?.length ? (
          <ul className="space-y-2 text-sm">
            {trucks.map((truck) => (
              <li key={truck.id}>
                {truck.name} - {truck.status};{" "}
                {truck.currentAddress ?? truck.primaryCity ?? "Location unavailable"}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No food trucks linked"
            description="Complete truck onboarding to make a truck available."
          />
        )}
      </section>
    </div>
  );
}

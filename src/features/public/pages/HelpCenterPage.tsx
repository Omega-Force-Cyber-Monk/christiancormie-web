import { Mail } from "lucide-react";

import { PublicInfoPage } from "@/features/public/components/PublicInfoPage";

const supportEmail = "support@bitedropapp.com";

const sections = [
  {
    title: "Contact Support",
    body: `For account assistance, booking questions, vendor verification, payment support, or platform questions, contact ${supportEmail}.`,
  },
  {
    title: "Account Help",
    body: "Support can assist with login issues, account access, profile details, and account-related questions.",
  },
  {
    title: "Vendor Services",
    body: "Food truck vendors can request assistance with verification, bookings, payouts, service areas, and business profile details.",
  },
  {
    title: "Payments and Bookings",
    body: "For booking status, payment release, payout, refund, or dispute questions, contact support with the relevant booking or transaction details.",
  },
];

export default function HelpCenterPage() {
  return (
    <div>
      <PublicInfoPage
        sections={sections}
        subtitle="Support for account, booking, vendor, payment, and platform questions."
        title="Help Center"
      />
      <a
        className="fixed bottom-4 right-4 inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white shadow-lg"
        href={`mailto:${supportEmail}`}
      >
        <Mail size={16} />
        Email Support
      </a>
    </div>
  );
}

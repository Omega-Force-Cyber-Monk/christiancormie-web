import { PublicInfoPage } from "@/features/public/components/PublicInfoPage";

const sections = [
  {
    title: "Acceptance of Terms",
    body: "By accessing or using Bite Drop services, users agree to these terms. Users who do not agree should not use the services.",
  },
  {
    title: "About Bite Drop",
    body: "Bite Drop is a food truck discovery, booking, and community platform that connects food lovers, vendors, event organizers, staff, and other platform participants.",
  },
  {
    title: "User Accounts",
    body: "Users must provide accurate information, keep account details current, and maintain the confidentiality of account credentials.",
  },
  {
    title: "Eligibility",
    body: "Users are responsible for complying with all applicable eligibility, age, vendor, staff, payment, and community requirements.",
  },
  {
    title: "Platform Role",
    body: "Bite Drop operates as a technology and marketing platform and is not a food service provider, payment institution, event organizer, or party to every transaction.",
  },
];

export default function TermsAndConditionsPage() {
  return (
    <PublicInfoPage
      sections={sections}
      subtitle="Effective Date: September 5, 2026. Last Updated: September 5, 2026."
      title="Terms & Conditions"
    />
  );
}

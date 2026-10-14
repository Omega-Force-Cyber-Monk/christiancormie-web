import { PublicInfoPage } from "@/features/public/components/PublicInfoPage";

const sections = [
  {
    title: "Information We Collect",
    body: "Bite Drop collects information users provide directly, including account, contact, payment, and location-related information needed to operate the platform.",
  },
  {
    title: "How We Use Information",
    body: "Information is used to provide, maintain, improve, and secure services, process transactions, send support messages, and communicate about platform activity.",
  },
  {
    title: "Location Data",
    body: "Location data may support discovery, community feed filtering, notifications, and location-based search. Users can manage device permissions through their settings.",
  },
  {
    title: "Information Sharing",
    body: "Personal information is not shared with third parties except as described in the policy, with consent, or through service providers who support platform operations.",
  },
  {
    title: "Data Security",
    body: "Reasonable measures are used to protect information from loss, misuse, unauthorized access, disclosure, alteration, and destruction.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PublicInfoPage
      sections={sections}
      subtitle="Effective Date: September 5, 2026. Last Updated: September 5, 2026."
      title="Privacy Policy"
    />
  );
}

import type { SettingsProfileValues } from "@/features/customer/schemas/settings.schema";

export type SettingsSection = "home" | "request" | "support" | "issue";
export const parseSettingsSection = (value: string | null): SettingsSection =>
  value === "request" || value === "support" || value === "issue" ? value : "home";
export const settingsTitles: Record<SettingsSection, string> = {
  home: "Settings",
  request: "Request a Truck",
  support: "Support",
  issue: "Report an Issue",
};

export const sampleSettingsProfile: SettingsProfileValues = {
  fullName: "Alex Rivera",
  displayName: "Alex Rivera",
  bio: "",
  email: "alex.rivera@email.com",
  phone: "+1 (555) 123-4567",
};
export const pointsGuide = [
  { action: "QR code check in", points: 10 },
  { action: "Leave a verified review", points: 25 },
  { action: "Follow a food truck", points: 5 },
  { action: "Make a booking", points: 100 },
  { action: "Community post", points: 10 },
  { action: "Refer a friend", points: 100 },
  { action: "Daily app streak", points: 5 },
  { action: "Complete profile setup", points: 50 },
  { action: "Birthday bonus", points: 50 },
] as const;

export type SupportMessage = {
  id: string;
  sender: "support" | "you";
  text: string;
  time: string;
  attachment?: File;
};
export type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: "Replied" | "Pending" | "Resolved";
  date: string;
  age: string;
  messages: SupportMessage[];
};
export const sampleSupportTickets: SupportTicket[] = [
  {
    id: "TX-8492",
    subject: "Payment issue",
    message: "I was charged twice for my last booking with Sarah Johnson.",
    status: "Replied",
    date: "April 10, 2026",
    age: "2 HOURS AGO",
    messages: [
      {
        id: "8492-1",
        sender: "support",
        text: "Hi! I'm on my way to your place.",
        time: "10:05 AM",
      },
      {
        id: "8492-2",
        sender: "you",
        text: "I was charged twice for my last booking with Sarah Johnson.",
        time: "10:05 AM",
      },
      {
        id: "8492-3",
        sender: "you",
        text: "Should I prepare anything",
        time: "10:05 AM",
      },
      {
        id: "8492-4",
        sender: "support",
        text: "Hello John, we investigated the and processed a refund for the duplicate charge. It should appear in you account",
        time: "10:05 AM",
      },
    ],
  },
  {
    id: "TX-8493",
    subject: "Refund request",
    message:
      "I am requesting a refund due to a cancellation on my flight with Delta Airlines.",
    status: "Pending",
    date: "April 11, 2026",
    age: "1 HOUR AGO",
    messages: [
      {
        id: "8493-1",
        sender: "you",
        text: "I am requesting a refund due to a cancellation on my flight with Delta Airlines.",
        time: "10:05 AM",
      },
    ],
  },
  {
    id: "TX-8494",
    subject: "Account access",
    message:
      "I couldn't log into my account, but the support team helped me reset my password.",
    status: "Resolved",
    date: "April 12, 2026",
    age: "30 MINS AGO",
    messages: [
      {
        id: "8494-1",
        sender: "you",
        text: "I couldn't log into my account, but the support team helped me reset my password.",
        time: "10:05 AM",
      },
    ],
  },
];

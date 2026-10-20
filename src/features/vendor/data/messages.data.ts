import practice from "@/features/vendor/assets/messages/messages-integration-practice-preview.pdf?url";
import formula from "@/features/vendor/assets/messages/messages-formula-sheet-preview.pdf?url";
import type {
  VendorConversation,
  VendorChatMessage,
} from "@/features/vendor/types/messages.types";
const emilyMessages: VendorChatMessage[] = [
  {
    id: "emily-1",
    direction: "out",
    text: "Of course! Which specific problem are you referring to?",
    time: "10:25 AM",
    attachments: [],
  },
  {
    id: "emily-2",
    direction: "in",
    text: "The one involving integration by parts with exponential functions. I'm not sure when to apply the formula.",
    time: "10:27 AM",
    attachments: [],
  },
  {
    id: "emily-3",
    direction: "out",
    text: "Great question! The key is to identify which part to differentiate and which to integrate. For exponential functions, we typically integrate them because the derivative of e^x is still e^x, making the problem easier.",
    time: "10:29 AM",
    attachments: [],
  },
  {
    id: "emily-4",
    direction: "in",
    text: "That makes sense! So I should choose e^x as the part to integrate?",
    time: "10:31 AM",
    attachments: [],
  },
  {
    id: "emily-5",
    direction: "out",
    text: "Exactly! And then differentiate the other part. Let me send you a couple of practice problems that will help solidify this concept.",
    time: "10:33 AM",
    attachments: [
      {
        id: "practice",
        name: "Integration Practice Problems.pdf",
        size: "245 KB",
        sampleUrl: practice,
      },
      { id: "formula", name: "Formula Sheet.pdf", size: "180 KB", sampleUrl: formula },
    ],
  },
  {
    id: "emily-6",
    direction: "in",
    text: "Thank you so much! That really helps.",
    time: "10:35 AM",
    attachments: [],
  },
];
const seoulPreview = "Sounds good! Looking forward to it.";
const tacoPreview = "We'd love to cater your event! Let";
const burgerPreview = "The quote for your corporate event";
export const vendorConversations: VendorConversation[] = [
  {
    id: "seoul-1",
    name: "Seoul Street",
    contact: "Emily Rodriguez",
    initials: "ER",
    active: true,
    age: "2d ago",
    preview: seoulPreview,
    unread: 0,
    messages: emilyMessages,
  },
  ...["seoul-2", "seoul-3"].map((id) => ({
    id,
    name: "Seoul Street",
    contact: "Seoul Street",
    initials: "SS",
    active: true,
    age: "2d ago",
    preview: seoulPreview,
    unread: 0,
    messages: [
      {
        id: `${id}-1`,
        direction: "in" as const,
        text: seoulPreview,
        time: "2d ago",
        attachments: [],
      },
    ],
  })),
  {
    id: "taco",
    name: "Taco Paradise",
    contact: "Taco Paradise",
    initials: "TP",
    active: false,
    age: "2m ago",
    preview: tacoPreview,
    unread: 2,
    messages: [
      {
        id: "taco-1",
        direction: "in",
        text: tacoPreview,
        time: "2m ago",
        attachments: [],
      },
    ],
  },
  ...["burger-1", "burger-2"].map((id) => ({
    id,
    name: "Burger Bliss",
    contact: "Burger Bliss",
    initials: "BB",
    active: true,
    age: "1h ago",
    preview: burgerPreview,
    unread: 1,
    messages: [
      {
        id: `${id}-1`,
        direction: "in" as const,
        text: burgerPreview,
        time: "1h ago",
        attachments: [],
      },
    ],
  })),
  {
    id: "seoul-4",
    name: "Seoul Street",
    contact: "Seoul Street",
    initials: "SS",
    active: true,
    age: "2d ago",
    preview: seoulPreview,
    unread: 0,
    messages: [
      {
        id: "seoul-4-1",
        direction: "in",
        text: seoulPreview,
        time: "2d ago",
        attachments: [],
      },
    ],
  },
];

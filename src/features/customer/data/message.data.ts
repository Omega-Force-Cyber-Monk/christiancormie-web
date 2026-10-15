export type MessageConversation = {
  id: string;
  name: string;
  preview: string;
  age: string;
  online: boolean;
  unread: number;
};

export type MessageEntry = {
  id: string;
  direction: "incoming" | "outgoing";
  body: string;
  time: string;
  attachments?: { name: string; size: string }[];
  localFiles?: File[];
  local?: boolean;
};

// Preserve the reference's repeated conversation rows and unrelated sample chat.
export const messageConversations: MessageConversation[] = [
  {
    id: "seoul-1",
    name: "Seoul Street",
    preview: "Sounds good! Looking forward to it.",
    age: "2d ago",
    online: true,
    unread: 0,
  },
  {
    id: "seoul-2",
    name: "Seoul Street",
    preview: "Sounds good! Looking forward to it.",
    age: "2d ago",
    online: true,
    unread: 0,
  },
  {
    id: "seoul-3",
    name: "Seoul Street",
    preview: "Sounds good! Looking forward to it.",
    age: "2d ago",
    online: true,
    unread: 0,
  },
  {
    id: "taco-paradise",
    name: "Taco Paradise",
    preview: "We'd love to cater your event! Let",
    age: "2m ago",
    online: false,
    unread: 2,
  },
  {
    id: "burger-1",
    name: "Burger Bliss",
    preview: "The quote for your corporate eve",
    age: "1h ago",
    online: true,
    unread: 1,
  },
  {
    id: "burger-2",
    name: "Burger Bliss",
    preview: "The quote for your corporate eve",
    age: "1h ago",
    online: true,
    unread: 1,
  },
  {
    id: "seoul-4",
    name: "Seoul Street",
    preview: "Sounds good! Looking forward to it.",
    age: "2d ago",
    online: true,
    unread: 0,
  },
];

export const referenceConversation = {
  id: "emily-reference",
  name: "Emily Rodriguez",
  online: true,
};

export const referenceMessages: MessageEntry[] = [
  {
    id: "reference-1",
    direction: "outgoing",
    body: "Of course! Which specific problem are you referring to?",
    time: "10:25 AM",
  },
  {
    id: "reference-2",
    direction: "incoming",
    body: "The one involving integration by parts with exponential functions. I'm not sure when to apply the formula.",
    time: "10:27 AM",
  },
  {
    id: "reference-3",
    direction: "outgoing",
    body: "Great question! The key is to identify which part to differentiate and which to integrate. For exponential functions, we typically integrate them because the derivative of e^x is still e^x, making the problem easier.",
    time: "10:29 AM",
  },
  {
    id: "reference-4",
    direction: "incoming",
    body: "That makes sense! So I should choose e^x as the part to integrate?",
    time: "10:31 AM",
  },
  {
    id: "reference-5",
    direction: "outgoing",
    body: "Exactly! And then differentiate the other part. Let me send you a couple of practice problems that will help solidify this concept.",
    time: "10:33 AM",
    attachments: [
      { name: "Integration Practice Problems.pdf", size: "245 KB" },
      { name: "Formula Sheet.pdf", size: "180 KB" },
    ],
  },
  {
    id: "reference-6",
    direction: "incoming",
    body: "Thank you so much! That really helps.",
    time: "10:35 AM",
  },
];

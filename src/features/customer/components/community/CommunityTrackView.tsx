import { ArrowLeft, Check, CheckCircle2, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/overlays/Modal/Modal";
import avatar from "@/features/customer/assets/community/14-alex-thompson.jpg";
import { CommunityRequestDetails } from "@/features/customer/components/community/CommunityRequestCard";
import {
  communityMoney,
  communityQuotes,
} from "@/features/customer/data/community-requests.data";
import type { CommunityPost } from "@/features/customer/data/community.data";

export function CommunityTrackView({
  post,
  onBack,
  onApprove,
  onIssue,
}: {
  post: CommunityPost;
  onBack: () => void;
  onApprove: () => void;
  onIssue: () => void;
}) {
  const [contact, setContact] = useState<"message" | "call" | null>(null);
  const quote =
    communityQuotes.find((item) => item.id === post.acceptedQuoteId) ??
    communityQuotes[1];
  if (!quote) return null;
  const complete = post.status === "Completed";
  return (
    <section className="community-track-view">
      <div className="community-page-heading">
        <Button aria-label="Back to My Requests" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h1>Track order</h1>
      </div>
      <div className="community-form-panel">
        <div className="community-track-banner">
          <h2 className="flex items-center gap-3 text-lg">
            <CheckCircle2 className="text-[#FF5733]" />
            {complete ? "Completed locally" : "Requested for completion"}
          </h2>
          <p className="mt-2 text-xs text-[#B8C1D1]">
            {complete
              ? "Completion approved in this local preview."
              : `${quote.name} requested to complete the sample job.`}
          </p>
          <Button
            className="community-primary mt-6 w-full"
            onClick={onApprove}
            disabled={complete}
          >
            {complete ? "Approved locally" : "Approve (preview)"}
          </Button>
          <Button
            className="mt-3 w-full border-[#FF5733] text-[#FF5733]"
            onClick={onIssue}
          >
            Report an issue
          </Button>
          {post.issue && (
            <p role="status" className="mt-3 text-sm text-[#2ED3D1]">
              Issue saved locally: {post.issue}
            </p>
          )}
        </div>
        <section className="community-track-timeline mt-4">
          <h2 className="mb-4 font-semibold">Sample Booking Timeline</h2>
          <ol className="space-y-5">
            {[
              "Booking confirmed",
              "Deposited",
              "Event day",
              "Request Pending",
              "Payment released",
            ].map((label, index) => (
              <li
                key={label}
                className={`flex items-center gap-3 text-sm ${index < 2 || complete ? "text-white" : index === 2 ? "text-[#FF5733]" : "text-[#7C8799]"}`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full ${index < 2 || complete ? "bg-[#FF5733]" : "border border-current"}`}
                >
                  {index < 2 || complete ? <Check size={16} /> : "•"}
                </span>
                {label} (sample only)
              </li>
            ))}
          </ol>
        </section>
        <section className="community-track-banner mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <img
              src={avatar}
              alt="Alex Thompson, sample customer"
              className="size-10 rounded-full"
            />
            <div className="flex-1">
              <h2 className="font-semibold">Alex Thompson</h2>
              <p className="text-xs text-[#B8C1D1]">Sample booking</p>
            </div>
            <span className="community-request-status">{post.request?.occasion}</span>
          </div>
          <CommunityRequestDetails post={post} />
          <div className="community-quote-breakdown rounded-xl bg-[#242D42] p-4">
            <h3 className="mb-3 font-semibold">Quote Breakdown</h3>
            <p className="mb-3 text-sm text-[#B8C1D1]">Menus</p>
            <ul className="mb-4 flex flex-wrap gap-2">
              {quote.menus.map((menu) => (
                <li className="rounded-full bg-[#121826] px-3 py-2 text-xs" key={menu}>
                  {menu}
                </li>
              ))}
            </ul>
            <dl>
              <div>
                <dt>Base service fee</dt>
                <dd>{communityMoney(quote.totalCents - quote.travelCents)}</dd>
              </div>
              <div>
                <dt>Transport / Travel</dt>
                <dd>{communityMoney(quote.travelCents)}</dd>
              </div>
              <div>
                <dt>Sample deposit</dt>
                <dd className="text-[#FFB547]">
                  −{communityMoney(quote.depositCents)}
                </dd>
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <dt>Balance at event</dt>
                <dd className="text-xl font-bold text-[#2ED3D1]">
                  {communityMoney(quote.totalCents - quote.depositCents)}
                </dd>
              </div>
            </dl>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button className="flex-1" onClick={() => setContact("message")}>
              <MessageCircle size={18} />
              Message
            </Button>
            <Button
              className="bg-[#2ED3D1] text-[#121826]"
              onClick={() => setContact("call")}
            >
              <Phone size={18} />
              Call truck
            </Button>
          </div>
        </section>
        <p className="mt-5 text-xs text-[#B8C1D1]">
          Static booking preview. No payment has been collected or released.
        </p>
      </div>
      <Modal
        isOpen={contact !== null}
        onClose={() => setContact(null)}
        titleId="community-contact-title"
      >
        <div className="p-6 pt-12">
          <h2 id="community-contact-title" className="text-xl font-semibold">
            {contact === "call" ? "Call truck" : "Message"} preview
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#B8C1D1]">
            Live contact information is not supplied. No call or message has been
            placed.
          </p>
        </div>
      </Modal>
    </section>
  );
}

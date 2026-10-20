import { ChevronUp, CreditCard } from "lucide-react";
import { useId } from "react";
import { Modal } from "@/components/overlays/Modal/Modal";
import { creditArtwork } from "@/features/vendor/data/earnings.data";
export function VendorCreditDetails({
  accepting,
  onToggle,
  onClose,
}: {
  accepting: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const id = useId();
  return (
    <Modal
      isOpen
      onClose={onClose}
      titleId={`${id}-title`}
      descriptionId={`${id}-description`}
      showCloseButton={false}
      panelClassName="vendor-credits-modal"
    >
      <VendorCreditDetailsContent
        id={id}
        accepting={accepting}
        onToggle={onToggle}
        onClose={onClose}
      />
    </Modal>
  );
}

export function VendorCreditDetailsContent({
  id,
  accepting,
  onToggle,
  onClose,
}: {
  id: string;
  accepting: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <header className="vendor-credits-modal-header">
        <span className="vendor-credit-icon">
          <CreditCard size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-title`} className="text-sm font-bold">
            BiteDrop Credits
          </h2>
          <p className="mt-1 text-xs">
            {accepting ? "Currently Accepting" : "Not Accepting"}
          </p>
        </div>
        <button
          type="button"
          className="vendor-credit-expand"
          aria-label="Close BiteDrop Credits details"
          onClick={onClose}
        >
          <ChevronUp size={17} />
        </button>
      </header>
      <button
        type="button"
        className="vendor-credits-modal-toggle"
        aria-pressed={accepting}
        onClick={onToggle}
      >
        <CreditCard size={17} /> Turn {accepting ? "Off" : "On"} Credit Acceptance
      </button>
      <section className="vendor-credit-help">
        <h3>
          <img src={creditArtwork.bulb} alt="" /> How Credit Redemption Works
        </h3>
        <ol>
          {[
            [
              "Customer chooses redemption:",
              "They can show their QR code, enter a code manually, or scan your vendor QR",
            ],
            [
              "Verify purchase minimum:",
              "Ensure order meets your tier's minimum (Free/Featured: $10, Premium: $5, Founding: $0)",
            ],
            [
              "Complete transaction:",
              "Credits are deducted instantly, you get paid in full - no processing fees",
            ],
          ].map(([label, description], index) => (
            <li key={label}>
              <span className="font-bold text-[#00D7FF]">{index + 1}.</span>
              <p>
                <strong>{label}</strong> {description}
              </p>
            </li>
          ))}
        </ol>
      </section>
      <section className="vendor-credit-benefits">
        <h3>
          <img src={creditArtwork.growth} alt="" /> Why This Grows Your Business
        </h3>
        <ul>
          {[
            {
              icon: creditArtwork.sparkles,
              label: "Priority visibility:",
              text: 'Featured in "Credit Accepted" filter - thousands search daily',
            },
            {
              icon: creditArtwork.target,
              label: "Attract ready buyers:",
              text: "Credit holders are actively looking to spend",
            },
            {
              icon: creditArtwork.repeat,
              label: "Drive repeat visits:",
              text: "Average 2.3x more visits from credit users",
            },
            {
              icon: creditArtwork.lightning,
              label: "Boost rankings:",
              text: "Credit transactions increase your platform score",
            },
          ].map((item) => (
            <li key={item.label}>
              <img src={item.icon} alt="" />
              <p>
                <strong>{item.label}</strong> {item.text}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section className="vendor-credit-methods">
        <h3>
          <img src={creditArtwork.clipboard} alt="" /> Redemption Method Details
        </h3>
        <ul>
          {[
            {
              icon: creditArtwork.search,
              label: "Staff Scan:",
              text: "Use your device to scan customer's QR code (fastest method)",
            },
            {
              icon: creditArtwork.keyboard,
              label: "Manual Entry:",
              text: "Customer tells you their code, you enter it on your device",
            },
            {
              icon: creditArtwork.phone,
              label: "Self-Service:",
              text: "Customer scans your vendor QR and redeems on their phone",
            },
          ].map((item) => (
            <li key={item.label}>
              <p>
                <img src={item.icon} alt="" />
                <strong>{item.label}</strong> {item.text}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <p
        id={`${id}-description`}
        className="mt-3 rounded-lg bg-black/30 p-3 text-xs leading-5"
      >
        Local preview only. These minimums, fee terms and growth claims are supplied
        design copy, not verified account rules or guarantees.
      </p>
      <p role="status" className="sr-only">
        Credit acceptance is {accepting ? "on" : "off"} in this preview. No account
        setting was changed.
      </p>
    </>
  );
}

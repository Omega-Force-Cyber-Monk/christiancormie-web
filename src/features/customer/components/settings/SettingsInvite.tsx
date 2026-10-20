import { useRef, useState } from "react";
import { FormField } from "@/components/forms/FormField";
import { ROUTES } from "@/constants/routes";

export function SettingsInvite() {
  const [status, setStatus] = useState("");
  const [copying, setCopying] = useState(false);
  const pending = useRef(false);
  const url = `${window.location.origin}${ROUTES.SIGNUP}`;
  async function copyLink() {
    if (pending.current) return;
    pending.current = true;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied.");
    } catch {
      setStatus("Copy is unavailable. Select the link above and copy it manually.");
    } finally {
      pending.current = false;
      setCopying(false);
    }
  }
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[#B8C1D1]">
        Share the signup link with a friend. This preview does not send invitations or
        award points.
      </p>
      <FormField
        label="Invitation link"
        readOnly
        value={url}
        onFocus={(event) => event.currentTarget.select()}
      />
      <button
        className="settings-primary"
        type="button"
        disabled={copying}
        onClick={() => {
          void copyLink();
        }}
      >
        {copying ? "Copying…" : "Copy invitation link"}
      </button>
      <p role="status" className="text-sm text-[#2ED3D1]">
        {status}
      </p>
    </div>
  );
}

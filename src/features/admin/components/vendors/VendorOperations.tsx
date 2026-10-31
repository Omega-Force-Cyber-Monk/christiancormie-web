import { useEffect, useRef, useState } from "react";
import { useStore } from "react-redux";
import { toast } from "sonner";
import { useAppSelector } from "@/app/hooks";
import type { RootState } from "@/app/store";
import { selectCurrentRole } from "@/features/auth/store/auth.selectors";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { Button } from "@/components/ui/Button";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import {
  adminVendorAllowed,
  matchingDocuments,
  useGetAdminVerificationRequestsQuery,
  useChangeAdminVendorStatusMutation,
  useUpdateAdminVerificationDocumentMutation,
} from "../../api/adminVendorOperations.api";
import type { VendorItem, LicenseDocument } from "./vendors.types";
function useAdminScope() {
  const auth = useAppSelector((s) => s.auth);
  const role = useAppSelector(selectCurrentRole);
  const scope = {
    sessionId: auth.sessionId ?? "",
    userId: auth.user?.id ?? "",
    role: role ?? "",
  };
  const allowed = useAppSelector((s) => adminVendorAllowed(s, scope));
  return { scope, allowed, key: `${scope.sessionId}:${scope.userId}:${scope.role}` };
}
export function VendorAccountOperations({ vendor }: { vendor: VendorItem }) {
  const identity = useAdminScope();
  return identity.allowed ? (
    <AccountOperations key={`${identity.key}:${vendor.id}`} vendor={vendor} />
  ) : (
    <p role="alert">A verified Admin session is required.</p>
  );
}
function AccountOperations({ vendor }: { vendor: VendorItem }) {
  const { scope } = useAdminScope();
  const store = useStore<RootState>();
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [change, state] = useChangeAdminVendorStatusMutation();
  const c = useConfirmation();
  function request(action: "suspend" | "retrieve") {
    c.confirm({
      title:
        action === "suspend" ? "Suspend vendor account?" : "Restore vendor access?",
      description: `${vendor.name} (${vendor.id}). ${action === "retrieve" ? "Restores platform account status to APPROVED; does not grant a verification badge." : "Changes platform account status to SUSPENDED."}`,
      confirmText: "Confirm",
      onConfirm: async () => {
        if (!mounted.current || !adminVendorAllowed(store.getState(), scope)) return;
        try {
          await change({
            ...scope,
            vendorId: vendor.id,
            action,
            confirmed: true,
          }).unwrap();
          if (mounted.current && adminVendorAllowed(store.getState(), scope))
            toast.success("Vendor status updated by the server.");
        } catch (e) {
          if (mounted.current && adminVendorAllowed(store.getState(), scope)) throw e;
        }
      },
    });
  }
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          disabled
          title="A specific optional badge and approved badge-removal meaning are required"
        >
          Remove Verified Badge unavailable
        </Button>
        <Button
          disabled={state.isLoading || vendor.source.status !== "APPROVED"}
          onClick={() => request("suspend")}
        >
          Suspend Account
        </Button>
        <Button
          disabled
          title="Initial platform approval must not be inferred from verification documents or restore"
        >
          Approve vendor unavailable
        </Button>
        <Button
          disabled={state.isLoading || vendor.source.status !== "SUSPENDED"}
          onClick={() => request("retrieve")}
        >
          Retrieve account
        </Button>
      </div>
      <p className="text-xs">
        Verification badges and platform access are separate. Unknown or pending account
        states cannot be restored through these controls.
      </p>
      {c.confirmationProps && <ConfirmationDialog {...c.confirmationProps} />}
    </div>
  );
}
export function VerificationDocumentOperations({
  document,
}: {
  document: LicenseDocument;
}) {
  const identity = useAdminScope();
  return identity.allowed && document.verification ? (
    <DocumentOperations
      key={`${identity.key}:${document.verification.requestId}:${document.verification.documentKey}`}
      document={document}
      verification={document.verification}
    />
  ) : (
    <p className="text-xs">
      Document decisions unavailable: verified Admin and unambiguous request/document
      identity are required.
    </p>
  );
}
function DocumentOperations({
  document,
  verification: ref,
}: {
  document: LicenseDocument;
  verification: NonNullable<LicenseDocument["verification"]>;
}) {
  const { scope } = useAdminScope();
  const [offset, setOffset] = useState(0);
  const query = useGetAdminVerificationRequestsQuery({ ...scope, offset });
  const [update, state] = useUpdateAdminVerificationDocumentMutation();
  const store = useStore<RootState>();
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const c = useConfirmation();
  const request = !query.error
    ? query.currentData?.find(
        (r) => r.id === ref.requestId && r.vendorId === ref.vendorId,
      )
    : undefined;
  const docs = request ? matchingDocuments(request.documents, ref.documentKey) : [];
  const currentDoc =
    !!document.url &&
    docs.length === 1 &&
    docs[0]?.url === document.source?.url &&
    typeof document.source?.url === "string"
      ? docs[0]
      : null;
  function decide(status: "APPROVED" | "REJECTED") {
    c.confirm({
      title:
        status === "APPROVED" ? "Approve this document?" : "Decline this document?",
      description: `Request ${ref.requestId}, document ${ref.documentKey}. Only this document status changes; overall verification, badge and platform access do not change.`,
      confirmText: "Confirm document decision",
      onConfirm: async () => {
        if (!mounted.current || !adminVendorAllowed(store.getState(), scope)) return;
        try {
          await update({
            ...scope,
            ...ref,
            expectedDocumentUrl:
              typeof document.source?.url === "string" ? document.source.url : "",
            body: { status },
            confirmed: true,
          }).unwrap();
          if (mounted.current && adminVendorAllowed(store.getState(), scope))
            toast.success("Document status confirmed by the server.");
        } catch (e) {
          if (mounted.current && adminVendorAllowed(store.getState(), scope)) throw e;
        }
      },
    });
  }
  return (
    <div className="space-y-2 text-xs">
      <p className="break-all">Verification request: {ref.requestId}</p>
      <p>
        Document status:{" "}
        {typeof currentDoc?.status === "string" ? currentDoc.status : "Unavailable"}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={
            !currentDoc ||
            query.isFetching ||
            state.isLoading ||
            currentDoc.status === "REJECTED"
          }
          onClick={() => decide("REJECTED")}
        >
          Decline
        </Button>
        <Button
          disabled={
            !currentDoc ||
            query.isFetching ||
            state.isLoading ||
            currentDoc.status === "APPROVED"
          }
          onClick={() => decide("APPROVED")}
        >
          Approve
        </Button>
        <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
          Refresh document status
        </Button>
      </div>
      {query.isFetching && <p role="status">Loading verification records…</p>}
      {query.error && <p role="alert">{normalizeApiError(query.error).message}</p>}
      {!currentDoc && !query.isFetching && (
        <p>
          Matching document unavailable in this returned page, or the submitted document
          changed. Refresh vendor details before deciding.
        </p>
      )}
      <div className="flex gap-2">
        <Button
          disabled={!offset || query.isFetching}
          onClick={() => setOffset(Math.max(0, offset - 100))}
        >
          Previous requests
        </Button>
        <Button
          disabled={
            query.isFetching || !query.currentData || query.currentData.length < 100
          }
          onClick={() => setOffset(offset + 100)}
        >
          Next requests
        </Button>
      </div>
      <p>Document decisions do not approve the vendor account or award badges.</p>
      {c.confirmationProps && <ConfirmationDialog {...c.confirmationProps} />}
    </div>
  );
}

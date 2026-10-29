import { useState } from "react";
import { Link } from "react-router";
import { useGetMemberConnectionsQuery } from "../api/socialProfile.api";
import { memberProfilePath } from "../utils/profileIdentity";
import { Modal } from "@/components/overlays/Modal/Modal";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/Button";
export function MemberConnectionsDialog({
  userId,
  direction,
  onClose,
}: {
  userId: string;
  direction: "followers" | "following";
  onClose: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const query = useGetMemberConnectionsQuery({ userId, direction, offset, limit: 20 });
  return (
    <Modal isOpen onClose={onClose} titleId="member-connections-title">
      <section className="p-6 pt-12">
        <h2 id="member-connections-title" className="text-xl font-semibold">
          {direction === "followers" ? "Followers" : "Following"}
        </h2>
        {query.isLoading || (query.isFetching && !query.currentData) ? (
          <p role="status">Loading connections…</p>
        ) : query.isError ? (
          <ErrorState onRetry={() => void query.refetch()} />
        ) : query.currentData?.items.length ? (
          <ul>
            {query.currentData.items.map((member) => (
              <li key={member.userId} className="py-3">
                <Link to={memberProfilePath(member.userId)} onClick={onClose}>
                  {member.displayName}
                </Link>
                <p className="text-xs">
                  {Number.isNaN(Date.parse(member.followedAt))
                    ? "Date unavailable"
                    : new Date(member.followedAt).toLocaleDateString("en-US", {
                        timeZone: "UTC",
                      })}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No connections found" />
        )}
        <div className="mt-4 flex gap-3">
          <Button
            disabled={offset === 0 || query.isFetching}
            onClick={() => setOffset((n) => Math.max(0, n - 20))}
          >
            Previous connections
          </Button>
          <Button
            disabled={query.currentData?.nextOffset == null || query.isFetching}
            onClick={() => {
              const next = query.currentData?.nextOffset;
              if (next != null) setOffset(next);
            }}
          >
            Next connections
          </Button>
        </div>
      </section>
    </Modal>
  );
}

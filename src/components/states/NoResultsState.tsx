import { EmptyState } from "@/components/states/EmptyState";

export function NoResultsState() {
  return (
    <EmptyState
      description="Try adjusting the search or filters."
      title="No matching results"
    />
  );
}

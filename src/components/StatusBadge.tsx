import type { ToggleState } from "@/types/domain";

export function StatusBadge({ state }: { state: ToggleState }) {
  return (
    <span className={state === "Blocked" ? "status-badge-blocked" : "status-badge-unblocked"}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${state === "Blocked" ? "bg-blocked" : "bg-unblocked"}`} />
      {state}
    </span>
  );
}

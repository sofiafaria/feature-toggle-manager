const methodColors: Record<string, string> = {
  GET: "bg-primary/10 text-primary",
  POST: "bg-success/10 text-success",
  PUT: "bg-warning/10 text-warning",
  PATCH: "bg-warning/10 text-warning",
  DELETE: "bg-blocked/10 text-blocked",
};

export function MethodBadge({ method }: { method: string }) {
  const color = methodColors[method] || "bg-muted text-muted-foreground";
  return <span className={`method-badge ${color}`}>{method}</span>;
}

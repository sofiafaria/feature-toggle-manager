import { useState, useMemo } from "react";
import { api } from "@/services/api";
import type { AuditRecord } from "@/types/domain";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

type SortField = "timestamp" | "user" | "actionType";

const ACTION_COLORS: Record<string, string> = {
  BLOCK: "bg-blocked/10 text-blocked",
  UNBLOCK: "bg-unblocked/10 text-unblocked",
  BULK_BLOCK: "bg-blocked/10 text-blocked",
  BULK_UNBLOCK: "bg-unblocked/10 text-unblocked",
  SETTINGS_UPDATE: "bg-primary/10 text-primary",
  CONTEXT_CHANGE: "bg-warning/10 text-warning",
};

export default function AuditPage() {
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  const records = mockApi.getAuditLog();

  const filtered = useMemo(() => {
    let result = [...records];
    if (userFilter) {
      const s = userFilter.toLowerCase();
      result = result.filter(r => r.user.toLowerCase().includes(s));
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(r => new Date(r.timestamp) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(r => new Date(r.timestamp) <= to);
    }
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [records, userFilter, dateFrom, dateTo, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
    setPage(1);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">Audit</h1>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">User</label>
          <Input className="h-8 w-40 text-xs" placeholder="Filter user..." value={userFilter} onChange={e => { setUserFilter(e.target.value); setPage(1); }} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input type="date" className="h-8 w-40 text-xs" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input type="date" className="h-8 w-40 text-xs" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ClipboardList className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No audit records</p>
          <p className="text-sm">Actions will appear here as they are performed.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44 cursor-pointer" onClick={() => toggleSort("timestamp")}>
                    <span className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="w-24 cursor-pointer" onClick={() => toggleSort("user")}>
                    <span className="flex items-center gap-1">User <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="w-32 cursor-pointer" onClick={() => toggleSort("actionType")}>
                    <span className="flex items-center gap-1">Action <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="w-40">Context</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="w-20">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{formatDate(r.timestamp)}</TableCell>
                    <TableCell className="text-xs font-medium">{r.user}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${ACTION_COLORS[r.actionType] || ""}`}>
                        {r.actionType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{r.contextDisplayName}</TableCell>
                    <TableCell className="text-xs font-mono max-w-xs truncate">{r.target}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${r.result === "Success" ? "bg-unblocked/10 text-unblocked" : "bg-blocked/10 text-blocked"}`}>
                        {r.result}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

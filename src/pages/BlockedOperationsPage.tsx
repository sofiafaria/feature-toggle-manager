import { useEffect, useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { api,apiRedis } from "@/services/api";
import type { BlockedOperation } from "@/types/domain";
import { formatOperationDisplay } from "@/types/domain";
import { StatusBadge } from "@/components/StatusBadge";
import { MethodBadge } from "@/components/MethodBadge";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Unlock, Loader2, ShieldOff, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 25;

export default function BlockedOperationsPage() {
  const { serviceName, contextId, currentContext } = useAppContext();
  const { username } = useAuth();
  const [operations, setOperations] = useState<BlockedOperation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [confirmOp, setConfirmOp] = useState<BlockedOperation | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await apiRedis.getBlockedOperations(serviceName, contextId);
    setOperations(data);
    setLoading(false);
  };

  useEffect(() => { load(); setPage(1); }, [serviceName, contextId]);

  const handleUnblock = (op: BlockedOperation) => {
    setConfirmOp(op);
  };

  const executeUnblock = async () => {
    if (!confirmOp) return;
    setActing(confirmOp.operationKey);
    setConfirmOp(null);
    await apiRedis.unblock(
      [{ serviceName: confirmOp.serviceName, apiName: confirmOp.apiName, method: confirmOp.method, urlTemplate: confirmOp.urlTemplate }],
      contextId, username!, currentContext.displayName
    );
    toast.success(`Unblocked: ${confirmOp.operationDisplayName}`);
    await load();
    setActing(null);
  };

  const filtered = operations.filter(op => {
    if (!search) return true;
    const s = search.toLowerCase();
    return formatOperationDisplay(op.apiDisplayName, op.operationDisplayName, op.method, op.apiPath, op.urlTemplate).toLowerCase().includes(s);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Blocked Operations</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} blocked operations in {currentContext.displayName}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search operations..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ShieldOff className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No blocked operations found</p>
          <p className="text-sm">All operations are currently unblocked, or adjust your search.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Method</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead className="w-24">State</TableHead>
                  <TableHead className="w-20 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(op => (
                  <TableRow key={op.operationKey} className="group">
                    <TableCell><MethodBadge method={op.method} /></TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium text-sm">{op.apiDisplayName}</span>
                        <span className="text-muted-foreground"> → </span>
                        <span className="text-sm">{op.operationDisplayName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{op.apiPath}{op.urlTemplate}</span>
                    </TableCell>
                    <TableCell><StatusBadge state="Blocked" /></TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm" variant="outline"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 text-xs"
                        disabled={acting === op.operationKey}
                        onClick={() => handleUnblock(op)}
                      >
                        {acting === op.operationKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlock className="h-3 w-3 mr-1" />}
                        Unblock
                      </Button>
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

      <ConfirmationModal
        open={!!confirmOp}
        onOpenChange={(open) => { if (!open) setConfirmOp(null); }}
        actionType="Unblock"
        itemCount={1}
        onConfirm={executeUnblock}
      />
    </div>
  );
}

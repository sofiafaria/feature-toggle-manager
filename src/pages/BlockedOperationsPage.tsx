import { useEffect, useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { mockApi } from "@/mock/api-service";
import type { BlockedOperation } from "@/types/domain";
import { formatOperationDisplay } from "@/types/domain";
import { StatusBadge } from "@/components/StatusBadge";
import { MethodBadge } from "@/components/MethodBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Unlock, Loader2, ShieldOff } from "lucide-react";
import { toast } from "sonner";

export default function BlockedOperationsPage() {
  const { serviceName } = useAppContext();
  const [operations, setOperations] = useState<BlockedOperation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await mockApi.getBlockedOperations(serviceName);
    setOperations(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [serviceName]);

  const handleUnblock = async (op: BlockedOperation) => {
    setActing(op.operationKey);
    await mockApi.unblock([{ serviceName: op.serviceName, apiName: op.apiName, method: op.method, urlTemplate: op.urlTemplate }]);
    toast.success(`Unblocked: ${op.operationDisplayName}`);
    await load();
    setActing(null);
  };

  const filtered = operations.filter(op => {
    if (!search) return true;
    const s = search.toLowerCase();
    const display = formatOperationDisplay(op.apiDisplayName, op.operationDisplayName, op.method, op.apiPath, op.urlTemplate).toLowerCase();
    return display.includes(s);
  });

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Blocked Operations</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} blocked operations in {serviceName}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search operations..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ShieldOff className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No blocked operations found</p>
          <p className="text-sm">All operations are currently unblocked, or adjust your search.</p>
        </div>
      ) : (
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
              {filtered.map(op => (
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
      )}
    </div>
  );
}

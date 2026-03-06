import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { mockApi } from "@/mock/api-service";
import type { Operation, ToggleState } from "@/types/domain";
import { APIS } from "@/mock/data";
import { StatusBadge } from "@/components/StatusBadge";
import { MethodBadge } from "@/components/MethodBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Lock, Unlock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OpRow extends Operation {
  state: ToggleState;
}

export default function ApiDetailPage() {
  const { apiName } = useParams<{ apiName: string }>();
  const { serviceName } = useAppContext();
  const navigate = useNavigate();
  const [operations, setOperations] = useState<OpRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const api = APIS.find(a => a.name === apiName);

  const load = async () => {
    if (!apiName) return;
    setLoading(true);
    const ops = await mockApi.getOperations(apiName);
    const rows: OpRow[] = ops.map(op => ({
      ...op,
      state: mockApi.getToggleState(serviceName, apiName, op.method, op.urlTemplate),
    }));
    setOperations(rows);
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => { load(); }, [apiName, serviceName]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === operations.length) setSelected(new Set());
    else setSelected(new Set(operations.map(o => o.id)));
  };

  const bulkAction = async (action: "block" | "unblock") => {
    const items = operations.filter(o => selected.has(o.id)).map(o => ({
      serviceName, apiName: apiName!, method: o.method, urlTemplate: o.urlTemplate,
    }));
    if (!items.length) return;
    setActing(true);
    if (action === "unblock") await mockApi.unblock(items);
    else await mockApi.block(items);
    toast.success(`${action === "block" ? "Blocked" : "Unblocked"} ${items.length} operation(s)`);
    await load();
    setActing(false);
  };

  const toggleSingle = async (op: OpRow) => {
    const item = { serviceName, apiName: apiName!, method: op.method, urlTemplate: op.urlTemplate };
    if (op.state === "Blocked") await mockApi.unblock([item]);
    else await mockApi.block([item]);
    toast.success(`${op.state === "Blocked" ? "Unblocked" : "Blocked"}: ${op.displayName}`);
    await load();
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/apis")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="page-title">{api?.displayName || apiName}</h1>
          <p className="text-sm text-muted-foreground font-mono">{api?.path}</p>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={acting} onClick={() => bulkAction("unblock")}>
            <Unlock className="h-3 w-3 mr-1" />Unblock
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={acting} onClick={() => bulkAction("block")}>
            <Lock className="h-3 w-3 mr-1" />Block
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={selected.size === operations.length && operations.length > 0} onCheckedChange={selectAll} />
                </TableHead>
                <TableHead className="w-16">Method</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead className="w-28">URL</TableHead>
                <TableHead className="w-24">State</TableHead>
                <TableHead className="w-24 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations.map(op => (
                <TableRow key={op.id}>
                  <TableCell>
                    <Checkbox checked={selected.has(op.id)} onCheckedChange={() => toggleSelect(op.id)} />
                  </TableCell>
                  <TableCell><MethodBadge method={op.method} /></TableCell>
                  <TableCell className="font-medium text-sm">{op.displayName}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{op.urlTemplate}</TableCell>
                  <TableCell><StatusBadge state={op.state} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleSingle(op)}>
                      {op.state === "Blocked" ? <><Unlock className="h-3 w-3 mr-1" />Unblock</> : <><Lock className="h-3 w-3 mr-1" />Block</>}
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

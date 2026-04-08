import { useEffect, useState } from "react";
import { api, apiRedis } from "@/services/api";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Api, Operation, ToggleState } from "@/types/domain";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/StatusBadge";
import { MethodBadge } from "@/components/MethodBadge";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, Layers, ChevronRight, ChevronDown, Lock, Unlock, Tag } from "lucide-react";
import { toast } from "sonner";

interface OpRow extends Operation {
  state: ToggleState;
  apiName: string;
}

export default function ApisPage() {
  const { serviceName, contextId, currentContext } = useAppContext();
  const { username } = useAuth();
  const [apis, setApis] = useState<Api[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedApis, setSelectedApis] = useState<Set<string>>(new Set());
  const [expandedApi, setExpandedApi] = useState<string | null>(null);
  const [operations, setOperations] = useState<OpRow[]>([]);
  const [selectedOps, setSelectedOps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [opsLoading, setOpsLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: "Block" | "Unblock"; items: { serviceName: string; apiName: string; method: string; urlTemplate: string }[] } | null>(null);

  useEffect(() => {
    Promise.all([api.getApis(), api.getTags()]).then(([a, t]) => {
      setApis(a); setTags(t); setLoading(false);
    });
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const toggleApiSelection = (name: string) => {
    setSelectedApis(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const filtered = apis.filter(a => {
    if (search) {
      const s = search.toLowerCase();
      if (!a.displayName.toLowerCase().includes(s) && !a.path.toLowerCase().includes(s)) return false;
    }
    if (selectedTags.size > 0 && !a.tags.some(t => selectedTags.has(t))) return false;
    return true;
  });

  const selectAllApis = () => {
    if (selectedApis.size === filtered.length) setSelectedApis(new Set());
    else setSelectedApis(new Set(filtered.map(a => a.name)));
  };

  const expandApi = async (apiName: string) => {
    if (expandedApi === apiName) { setExpandedApi(null); setOperations([]); setSelectedOps(new Set()); return; }
    setExpandedApi(apiName);
    setOpsLoading(true);
    setSelectedOps(new Set());
    const ops = await api.getOperations(apiName);
    const rows: OpRow[] = await Promise.all(ops.map(async (op) => ({
      ...op,
      apiName,
      state: await apiRedis.getToggleStateAsync(serviceName, apiName, op.method, op.urlTemplate, contextId),
    })));
    setOperations(rows);
    setOpsLoading(false);
  };

  const toggleOpSelection = (id: string) => {
    setSelectedOps(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllOps = () => {
    if (selectedOps.size === operations.length) setSelectedOps(new Set());
    else setSelectedOps(new Set(operations.map(o => o.id)));
  };

  // Gather items for bulk action across selected APIs and/or selected operations
  const gatherBulkItems = async (): Promise<{ serviceName: string; apiName: string; method: string; urlTemplate: string }[]> => {
    const items: { serviceName: string; apiName: string; method: string; urlTemplate: string }[] = [];

    // If operations are selected in expanded API
    if (selectedOps.size > 0 && expandedApi) {
      for (const op of operations.filter(o => selectedOps.has(o.id))) {
        items.push({ serviceName, apiName: op.apiName, method: op.method, urlTemplate: op.urlTemplate });
      }
    }

    // Selected APIs (gather all ops)
    for (const apiName of selectedApis) {
      if (expandedApi === apiName && selectedOps.size > 0) continue; // already handled via ops
      const ops = await api.getOperations(apiName);
      for (const op of ops) {
        items.push({ serviceName, apiName, method: op.method, urlTemplate: op.urlTemplate });
      }
    }

    return items;
  };

  const requestBulkAction = async (action: "Block" | "Unblock") => {
    const items = await gatherBulkItems();
    if (!items.length) { toast.error("No items selected"); return; }
    setConfirmAction({ type: action, items });
  };

  const executeBulkAction = async () => {
    if (!confirmAction) return;
    setActing(true);
    const { type, items } = confirmAction;
    setConfirmAction(null);
    if (type === "Unblock") await apiRedis.unblock(items, contextId, username!, currentContext.displayName);
    else await apiRedis.block(items, contextId, username!, currentContext.displayName);
    toast.success(`${type === "Block" ? "Blocked" : "Unblocked"} ${items.length} operation(s)`);

    // Reload expanded API operations
    if (expandedApi) {
      const ops = await api.getOperations(expandedApi);
      console.log(ops)
      const operationsWithState: OpRow[] = await Promise.all(ops.map(async (op) => ({
        ...op,
        apiName: expandedApi,
        state: await apiRedis.getToggleStateAsync(serviceName, expandedApi, op.method, op.urlTemplate, contextId),
        //state: api.getToggleState(serviceName, expandedApi, op.method, op.urlTemplate, contextId),
      })));
      setOperations(operationsWithState);
    }
    setSelectedOps(new Set());
    setSelectedApis(new Set());
    setActing(false);
  };

  const toggleSingleOp = (op: OpRow) => {
    const action = op.state === "Blocked" ? "Unblock" : "Block";
    setConfirmAction({
      type: action,
      items: [{ serviceName, apiName: op.apiName, method: op.method, urlTemplate: op.urlTemplate }],
    });
  };

  const hasSelection = selectedApis.size > 0 || selectedOps.size > 0;

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">APIs</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or URL suffix..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedTags.has(tag) ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent border-border"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {hasSelection && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-sm font-medium">
            {selectedApis.size > 0 && `${selectedApis.size} API(s)`}
            {selectedApis.size > 0 && selectedOps.size > 0 && " + "}
            {selectedOps.size > 0 && `${selectedOps.size} operation(s)`}
            {" selected"}
          </span>
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={acting} onClick={() => requestBulkAction("Unblock")}>
            <Unlock className="h-3 w-3 mr-1" />Unblock Selected
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={acting} onClick={() => requestBulkAction("Block")}>
            <Lock className="h-3 w-3 mr-1" />Block Selected
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Layers className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No APIs found</p>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-1 mb-2">
            <Checkbox
              checked={selectedApis.size === filtered.length && filtered.length > 0}
              onCheckedChange={selectAllApis}
            />
            <span className="text-xs text-muted-foreground">Select all ({filtered.length})</span>
          </div>

          {filtered.map(api => (
            <div key={api.id}>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <Checkbox
                  checked={selectedApis.has(api.name)}
                  onCheckedChange={() => toggleApiSelection(api.name)}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={() => expandApi(api.name)}
                  className="flex items-center justify-between flex-1 min-w-0 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{api.displayName}</span>
                      <span className="text-xs font-mono text-muted-foreground">{api.path}</span>
                    </div>
                    <div className="flex gap-1.5 mt-1.5">
                      {api.tags.map(t => (
                        <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  {expandedApi === api.name ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              </div>

              {expandedApi === api.name && (
                <div className="ml-8 mt-1 mb-2 rounded-lg border bg-card overflow-hidden">
                  {opsLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox checked={selectedOps.size === operations.length && operations.length > 0} onCheckedChange={selectAllOps} />
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
                              <Checkbox checked={selectedOps.has(op.id)} onCheckedChange={() => toggleOpSelection(op.id)} />
                            </TableCell>
                            <TableCell><MethodBadge method={op.method} /></TableCell>
                            <TableCell className="font-medium text-sm">{op.displayName}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{op.urlTemplate}</TableCell>
                            <TableCell><StatusBadge state={op.state} /></TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleSingleOp(op)}>
                                {op.state === "Blocked" ? <><Unlock className="h-3 w-3 mr-1" />Unblock</> : <><Lock className="h-3 w-3 mr-1" />Block</>}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        actionType={confirmAction?.type || "Block"}
        itemCount={confirmAction?.items.length || 0}
        onConfirm={executeBulkAction}
      />
    </div>
  );
}

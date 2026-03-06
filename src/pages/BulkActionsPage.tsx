import { useEffect, useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { mockApi } from "@/mock/api-service";
import type { Api, Gateway } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Lock, Unlock, Loader2, Zap, Tag } from "lucide-react";
import { toast } from "sonner";

export default function BulkActionsPage() {
  const { serviceName } = useAppContext();
  const [apis, setApis] = useState<Api[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedApis, setSelectedApis] = useState<Set<string>>(new Set());
  const [selectedGateway, setSelectedGateway] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    Promise.all([mockApi.getApis(), mockApi.getTags(), mockApi.getGateways()]).then(([a, t, g]) => {
      setApis(a); setTags(t); setGateways(g); setLoading(false);
    });
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const toggleApi = (name: string) => {
    setSelectedApis(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const filteredApis = apis.filter(a => {
    if (search) {
      const s = search.toLowerCase();
      if (!a.displayName.toLowerCase().includes(s) && !a.path.toLowerCase().includes(s)) return false;
    }
    if (selectedTags.size > 0) {
      if (!a.tags.some(t => selectedTags.has(t))) return false;
    }
    return true;
  });

  const selectAll = () => {
    if (selectedApis.size === filteredApis.length) setSelectedApis(new Set());
    else setSelectedApis(new Set(filteredApis.map(a => a.name)));
  };

  const handleBulkAction = async (action: "block" | "unblock") => {
    setActing(true);
    const gw = selectedGateway !== "all" ? selectedGateway : undefined;

    // If tags selected, use tag-based bulk
    if (selectedTags.size > 0 && selectedApis.size === 0) {
      const count = await mockApi.bulkByTag(serviceName, [...selectedTags], action, gw);
      toast.success(`${action === "block" ? "Blocked" : "Unblocked"} ${count} operations by tag`);
    } else {
      // Bulk by selected APIs
      const items: { serviceName: string; apiName: string; method: string; urlTemplate: string; gatewayId?: string }[] = [];
      for (const apiName of selectedApis) {
        const ops = await mockApi.getOperations(apiName);
        for (const op of ops) {
          items.push({ serviceName, apiName, method: op.method, urlTemplate: op.urlTemplate, gatewayId: gw });
        }
      }
      if (action === "unblock") await mockApi.unblock(items);
      else await mockApi.block(items);
      toast.success(`${action === "block" ? "Blocked" : "Unblocked"} ${items.length} operations`);
    }
    setActing(false);
  };

  const hasSelection = selectedTags.size > 0 || selectedApis.size > 0;

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">Bulk Actions</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filter APIs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox checked={selectedApis.size === filteredApis.length && filteredApis.length > 0} onCheckedChange={selectAll} />
              <span className="text-sm text-muted-foreground">Select all ({filteredApis.length})</span>
            </div>

            <div className="grid gap-2">
              {filteredApis.map(api => (
                <label
                  key={api.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <Checkbox checked={selectedApis.has(api.name)} onCheckedChange={() => toggleApi(api.name)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{api.displayName}</span>
                      <span className="text-xs font-mono text-muted-foreground">{api.path}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {api.tags.map(t => (
                        <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>
                      ))}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Tag className="h-4 w-4" />Filter by Tags</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Gateway Scope</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedGateway} onValueChange={setSelectedGateway}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Gateways (Global)</SelectItem>
                    {gateways.map(g => (
                      <SelectItem key={g.id} value={g.name}>{g.name} ({g.type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4" />Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" disabled={!hasSelection || acting} onClick={() => handleBulkAction("unblock")}>
                  {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
                  Unblock Selected
                </Button>
                <Button variant="outline" className="w-full" disabled={!hasSelection || acting} onClick={() => handleBulkAction("block")}>
                  {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                  Block Selected
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { mockApi } from "@/mock/api-service";
import type { Api } from "@/types/domain";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Layers, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ApisPage() {
  const [apis, setApis] = useState<Api[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    mockApi.getApis().then(data => { setApis(data); setLoading(false); });
  }, []);

  const filtered = apis.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return a.displayName.toLowerCase().includes(s) || a.path.toLowerCase().includes(s);
  });

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">APIs</h1>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or URL suffix..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Layers className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No APIs found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(api => (
            <button
              key={api.id}
              onClick={() => navigate(`/apis/${api.name}`)}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{api.displayName}</span>
                  <span className="text-xs font-mono text-muted-foreground">{api.path}</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {api.tags.map(t => (
                    <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>
                  ))}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

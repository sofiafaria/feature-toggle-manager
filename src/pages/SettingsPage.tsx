import { useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Globe, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { username } = useAuth();
  const contexts = api.getContexts();
  const [endpoints, setEndpoints] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    contexts.forEach(c => { map[c.id] = api.getContextEndpoint(c.id); });
    return map;
  });
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});

  const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
  };

  const handleSave = (contextId: string) => {
    const url = endpoints[contextId] || "";
    if (!isValidUrl(url)) { toast.error("Invalid URL format"); return; }
    const ctx = contexts.find(c => c.id === contextId);
    api.updateContextEndpoint(contextId, url, username!, ctx?.displayName || contextId);
    toast.success(`Endpoint saved for ${ctx?.displayName}`);
  };

  const handleTest = async (contextId: string) => {
    const url = endpoints[contextId] || "";
    if (!isValidUrl(url)) { toast.error("Invalid URL format"); return; }
    setTesting(contextId);
    setTestResults(prev => ({ ...prev, [contextId]: null }));
    const result = await api.testConnection(url);
    setTestResults(prev => ({ ...prev, [contextId]: result.success }));
    setTesting(null);
    if (result.success) toast.success("Connection successful");
    else toast.error(`Connection failed: ${result.error}`);
  };

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">Settings</h1>

      <div className="grid gap-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4" />Context Endpoint Configuration</CardTitle>
            <CardDescription>Configure the gateway endpoint URL for each context</CardDescription>
          </CardHeader>
        </Card>

        {contexts.map(ctx => (
          <Card key={ctx.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                {ctx.displayName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Gateway Endpoint URL</Label>
                <div className="flex gap-2">
                  <Input
                    className="text-xs font-mono flex-1"
                    placeholder="https://..."
                    value={endpoints[ctx.id] || ""}
                    onChange={e => setEndpoints(prev => ({ ...prev, [ctx.id]: e.target.value }))}
                  />
                  <Button size="sm" variant="outline" onClick={() => handleSave(ctx.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleTest(ctx.id)} disabled={testing === ctx.id}>
                    {testing === ctx.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Test"}
                  </Button>
                </div>
              </div>
              {testResults[ctx.id] !== undefined && testResults[ctx.id] !== null && (
                <div className={`flex items-center gap-1.5 text-xs ${testResults[ctx.id] ? "text-unblocked" : "text-blocked"}`}>
                  {testResults[ctx.id] ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  {testResults[ctx.id] ? "Connection successful" : "Connection failed"}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

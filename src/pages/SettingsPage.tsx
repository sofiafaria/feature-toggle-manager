import { useState } from "react";
import { mockApi } from "@/mock/api-service";
import type { PolicyMode } from "@/types/domain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Settings, FileText, Upload, Download, Code } from "lucide-react";

const BACKOFFICE_POLICY = `<send-request mode="new" response-variable-name="toggleRes" timeout="3" ignore-error="true">
  <set-url>https://YOUR_BACKOFFICE_URL/api/toggles/check?service=@(context.Deployment.ServiceName)&apiId=@(context.Api.Name)&opId=@(context.Operation.Name)&method=@(context.Operation.Method)&path=@(Uri.EscapeDataString(context.Operation.UrlTemplate))&gateway=@(context.Gateway?.Name)</set-url>
  <set-method>GET</set-method>
</send-request>
<choose>
  <when condition="@{
    var res = (IResponse)context.Variables[\\"toggleRes\\"];
    if (res == null || res.StatusCode != 200) return true;
    var body = (JObject)res.Body.As<JToken>();
    return body[\\"allowed\\"]?.ToObject<bool>() == false;
  }">
    <return-response>
      <set-status code="403" reason="Blocked by APIM feature toggle" />
    </return-response>
  </when>
</choose>`;

const NAMED_VALUE_POLICY = `<set-variable name="allowJson" value="{{featureToggleAllowlist}}" />
<set-variable name="isAllowed" value="@{
  var json = (string)context.Variables[\\"allowJson\\"];
  if (string.IsNullOrEmpty(json)) return false;
  var arr = (JArray)JToken.Parse(json);
  var key = $\\"{context.Deployment.ServiceName}:{context.Api.Name}:{context.Operation.Method}:{context.Operation.UrlTemplate}\\";
  return arr.Any(x => (string)x[\\"operationKey\\"] == key);
}" />
<choose>
  <when condition="@(!(bool)context.Variables[\\"isAllowed\\"])">
    <return-response>
      <set-status code="403" reason="Blocked by APIM feature toggle" />
    </return-response>
  </when>
</choose>`;

export default function SettingsPage() {
  const [mode, setMode] = useState<PolicyMode>(mockApi.getPolicyMode());
  const [debugLogs, setDebugLogs] = useState(false);

  const handleModeChange = (checked: boolean) => {
    const newMode: PolicyMode = checked ? "APIM_NAMED_VALUE" : "BACKOFFICE_CHECK";
    setMode(newMode);
    mockApi.setPolicyMode(newMode);
    toast.success(`Policy mode set to ${newMode}`);
  };

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">Settings</h1>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4" />Policy Mode</CardTitle>
            <CardDescription>Choose how APIM policies check the feature toggle allowlist</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">{mode === "BACKOFFICE_CHECK" ? "Backoffice Check (HTTP)" : "APIM Named Value (JSON)"}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {mode === "BACKOFFICE_CHECK"
                    ? "APIM policies query the backoffice at runtime via send-request"
                    : "Allowlist stored as JSON in APIM Named Value; parsed in policy"}
                </p>
              </div>
              <Switch checked={mode === "APIM_NAMED_VALUE"} onCheckedChange={handleModeChange} />
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  <Code className="h-3 w-3 mr-1" />View Policy Snippet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>APIM Policy Snippet — {mode}</DialogTitle>
                </DialogHeader>
                <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {mode === "BACKOFFICE_CHECK" ? BACKOFFICE_POLICY : NAMED_VALUE_POLICY}
                </pre>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {mode === "APIM_NAMED_VALUE" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Named Value Sync</CardTitle>
              <CardDescription>Push or pull the allowlist to/from APIM Named Values</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => toast.info("Push to APIM (mock)")}>
                <Upload className="h-4 w-4 mr-2" />Push to APIM
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast.info("Pull from APIM (mock)")}>
                <Download className="h-4 w-4 mr-2" />Pull from APIM
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Debug Logging</Label>
                <p className="text-xs text-muted-foreground mt-1">Enable verbose console logging for troubleshooting</p>
              </div>
              <Switch checked={debugLogs} onCheckedChange={setDebugLogs} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Raw Allowlist</CardTitle>
            <CardDescription>{mockApi.getAllowlist().length} entries</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded-lg text-xs font-mono max-h-60 overflow-auto">
              {JSON.stringify(mockApi.getAllowlist(), null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

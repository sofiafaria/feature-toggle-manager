import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ENVIRONMENTS, SERVICES } from "@/mock/data";
import { LogOut, Shield, Server } from "lucide-react";
import type { EnvironmentId } from "@/types/domain";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Topbar() {
  const { environmentId, setEnvironment, serviceName, setService } = useAppContext();
  const { username, logout } = useAuth();

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="mr-1" />
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm tracking-tight hidden sm:inline">APIM Feature Toggle</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <Select value={environmentId} onValueChange={(v) => setEnvironment(v as EnvironmentId)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENVIRONMENTS.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select value={serviceName} onValueChange={(v) => {
          const svc = SERVICES.find(s => s.name === v);
          if (svc) setService(svc.name, svc.resourceGroup);
        }}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SERVICES.map(s => (
              <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-2 border-l pl-3">
          <span className="text-xs text-muted-foreground">{username}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

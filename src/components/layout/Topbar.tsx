import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LogOut, Shield } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

export function Topbar() {
  const { contextId, setContextId, allContexts } = useAppContext();
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const handleContextChange = (id: string) => {
    setContextId(id);
    navigate("/blocked", { replace: true });
  };

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="mr-1" />
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm tracking-tight hidden sm:inline">APIM Feature Toggle</span>
      </div>

      <div className="flex items-center gap-3">
        <Select value={contextId} onValueChange={handleContextChange}>
          <SelectTrigger className="w-[220px] h-8 text-xs">
            <SelectValue placeholder="Select Context" />
          </SelectTrigger>
          <SelectContent>
            {allContexts.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
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

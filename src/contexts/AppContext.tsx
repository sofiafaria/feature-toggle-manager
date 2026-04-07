import React, { createContext, useContext, useState, useCallback } from "react";
import type { AppContextDef } from "@/types/domain";
import { CONTEXTS } from "@/mock/data";
import { api } from "@/services/api";
import { useAuth } from "./AuthContext";

interface AppContextValue {
  contextId: string;
  currentContext: AppContextDef;
  allContexts: AppContextDef[];
  setContextId: (id: string) => void;
  serviceName: string;
}

const AppCtx = createContext<AppContextValue | null>(null);

// Map context to a service name for operation key building
function serviceNameForContext(ctx: AppContextDef): string {
  const envMap: Record<string, string> = {
    DEV: "apim-contoso-dev",
    QA: "apim-contoso-qa",
    PRE: "apim-contoso-pre",
    PRD: "apim-contoso-prd",
  };
  return envMap[ctx.environmentId] || "apim-contoso-dev";
}

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [contextId, setContextIdState] = useState(CONTEXTS[0].id);
  const { username } = useAuth();

  const allContexts = mockApi.getContexts();
  const currentContext = allContexts.find(c => c.id === contextId) || allContexts[0];
  const serviceName = serviceNameForContext(currentContext);

  const setContextId = useCallback((id: string) => {
    setContextIdState(id);
    const ctx = CONTEXTS.find(c => c.id === id);
    if (ctx && username) {
      mockApi.logContextChange(username, ctx.displayName);
    }
  }, [username]);

  return (
    <AppCtx.Provider value={{ contextId, currentContext, allContexts, setContextId, serviceName }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useAppContext must be used within AppContextProvider");
  return ctx;
}

import React, { createContext, useContext, useState, useCallback } from "react";
import type { EnvironmentId } from "@/types/domain";

interface AppContextValue {
  environmentId: EnvironmentId;
  serviceName: string;
  resourceGroup: string;
  setEnvironment: (id: EnvironmentId) => void;
  setService: (name: string, rg: string) => void;
}

const AppCtx = createContext<AppContextValue | null>(null);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [environmentId, setEnvironmentId] = useState<EnvironmentId>("DEV");
  const [serviceName, setServiceName] = useState("apim-contoso-dev");
  const [resourceGroup, setResourceGroup] = useState("rg-apim-dev");

  const setEnvironment = useCallback((id: EnvironmentId) => setEnvironmentId(id), []);
  const setService = useCallback((name: string, rg: string) => {
    setServiceName(name);
    setResourceGroup(rg);
  }, []);

  return (
    <AppCtx.Provider value={{ environmentId, serviceName, resourceGroup, setEnvironment, setService }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useAppContext must be used within AppContextProvider");
  return ctx;
}

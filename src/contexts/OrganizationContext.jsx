import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, asArray } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const OrganizationCtx = createContext(null);
const STORAGE_KEY = "propzel.activeOrganizationId";

export function OrganizationProvider({ children }) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState(() => localStorage.getItem(STORAGE_KEY) || "");

  const refreshOrganizations = useCallback(async () => {
    if (!user || user === false) return;
    const { data } = await api.get("/organizations");
    const orgs = asArray(data);
    setOrganizations(orgs);
    const permitted = user.role === "super_admin" ? orgs : orgs.filter((org) => org.id === user.organization_id);
    const current = localStorage.getItem(STORAGE_KEY);
    const next = permitted.some((org) => org.id === current) ? current : (permitted[0]?.id || "");
    setActiveOrganizationId(next);
    if (next) localStorage.setItem(STORAGE_KEY, next);
  }, [user]);

  useEffect(() => { refreshOrganizations().catch(() => {}); }, [refreshOrganizations]);

  const setActiveOrganization = (organizationId) => {
    setActiveOrganizationId(organizationId);
    if (organizationId) localStorage.setItem(STORAGE_KEY, organizationId);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const activeOrganization = organizations.find((organization) => organization.id === activeOrganizationId) || null;
  return <OrganizationCtx.Provider value={{ organizations, activeOrganization, activeOrganizationId, setActiveOrganization, refreshOrganizations }}>{children}</OrganizationCtx.Provider>;
}

export const useOrganization = () => useContext(OrganizationCtx);

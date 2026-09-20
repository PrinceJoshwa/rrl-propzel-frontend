import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AdminEODSummary from "@/components/AdminEODSummary";
import { useOrganization } from "@/contexts/OrganizationContext";

export default function AppLayout() {
  const { activeOrganizationId } = useOrganization();
  return (
    <div className="flex min-h-screen bg-bone">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 min-w-0 p-8 animate-fade-in">
          <div key={activeOrganizationId || "unselected"}><Outlet /></div>
        </main>
      </div>
      <AdminEODSummary mode="modal-controller" />
    </div>
  );
}

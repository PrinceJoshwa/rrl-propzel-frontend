import React, { useEffect, useState } from "react";
import { api, asArray, relTime } from "@/lib/api";
import { useProjects } from "@/contexts/ProjectContext";
import { Link } from "react-router-dom";
import { VISIT } from "@/constants/testIds";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, CalendarDays, ChevronLeft, ChevronRight, List, MapPin, User2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_TONE = {
  scheduled: "bg-[#457B9D]/10 text-[#457B9D] border-[#457B9D]/30",
  completed: "bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/30",
  no_show: "bg-[#C25934]/10 text-[#C25934] border-[#C25934]/30",
  cancelled: "bg-forest/10 text-forest border-forest/30",
};

export default function SiteVisits() {
  const { activeId, projects } = useProjects();
  const [visits, setVisits] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("");
  const [view, setView] = useState("calendar");
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const load = async () => {
    const params = {};
    if (activeId && activeId !== "__all__") params.project_id = activeId;
    const [v, l, u] = await Promise.all([
      api.get("/site-visits", { params }),
      api.get("/leads", { params }),
      api.get("/users"),
    ]);
    setVisits(asArray(v.data));
    setLeads(asArray(l.data));
    setUsers(asArray(u.data));
  };
// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [activeId]);
  const filtered = visits.filter((v) => !status || v.status === status);
  const grouped = filtered.reduce((acc, v) => {
    const d = new Date(v.scheduled_at).toDateString();
    (acc[d] = acc[d] || []).push(v);
    return acc;
  }, {});
  const monthDays = Array.from({ length: 42 }, (_, index) => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const day = new Date(first); day.setDate(index - first.getDay() + 1);
    return day;
  });
  const visitForDay = (day) => filtered.filter((v) => new Date(v.scheduled_at).toDateString() === day.toDateString());

  const updateStatus = async (id, s) => {
    await api.patch(`/site-visits/${id}`, { status: s });
    toast.success(`Visit ${s.replace("_", " ")}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="label-caps">Site visits</div>
          <h2 className="font-display font-black text-3xl text-forest tracking-tight mt-1">
            {filtered.length} scheduled
          </h2>
        </div>
        <div className="flex items-center gap-2">
        <div className="inline-flex border border-[#E6E4DD] rounded-sm overflow-hidden"><button onClick={() => setView("calendar")} title="Calendar view" className={`h-9 w-9 grid place-items-center ${view === "calendar" ? "bg-forest text-white" : "bg-white text-forest"}`}><CalendarDays className="h-4 w-4" /></button><button onClick={() => setView("agenda")} title="Agenda view" className={`h-9 w-9 grid place-items-center ${view === "agenda" ? "bg-forest text-white" : "bg-white text-forest"}`}><List className="h-4 w-4" /></button></div>
        <Select value={status || "__all__"} onValueChange={(v) => setStatus(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-[160px] h-9 rounded-sm border-[#E6E4DD]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="no_show">No show</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        </div>
      </div>

      {view === "calendar" && <div className="border border-[#E6E4DD] bg-white rounded-sm overflow-hidden"><div className="p-4 border-b border-[#E6E4DD] flex items-center justify-between"><button title="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="h-8 w-8 border border-[#E6E4DD] rounded-sm grid place-items-center"><ChevronLeft className="h-4 w-4" /></button><div className="font-display font-bold text-xl text-forest">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div><button title="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="h-8 w-8 border border-[#E6E4DD] rounded-sm grid place-items-center"><ChevronRight className="h-4 w-4" /></button></div><div className="grid grid-cols-7 border-l border-t border-[#E6E4DD]">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="p-2 border-r border-b border-[#E6E4DD] bg-bone-alt/50 text-[10px] uppercase tracking-[0.14em] text-forest/50">{day}</div>)}{monthDays.map((day) => { const entries = visitForDay(day); const current = day.getMonth() === month.getMonth(); return <div key={day.toISOString()} className={`min-h-28 p-2 border-r border-b border-[#E6E4DD] ${current ? "bg-white" : "bg-bone-alt/25 text-forest/35"}`}><div className="text-xs font-bold mb-2">{day.getDate()}</div><div className="space-y-1">{entries.slice(0, 3).map((visit) => { const lead = leads.find((l) => l.id === visit.lead_id); return <Link key={visit.id} to={`/leads/${visit.lead_id}`} className="block px-1.5 py-1 rounded-sm bg-forest/8 text-[10px] text-forest truncate"><b>{new Date(visit.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</b> {lead?.name || "Visit"}</Link>; })}{entries.length > 3 && <div className="text-[10px] text-forest/55">+{entries.length - 3} more</div>}</div></div>; })}</div></div>}

      {view === "agenda" && <div className="space-y-6">
        {Object.entries(grouped).sort((a, b) => new Date(a[0]) - new Date(b[0])).map(([day, arr]) => (
          <div key={day} className="border border-[#E6E4DD] bg-white rounded-sm">
            <div className="px-5 py-3 border-b border-[#E6E4DD] flex items-center justify-between bg-bone-alt/40">
              <div className="font-display font-bold text-lg text-forest tracking-tight">{day}</div>
              <div className="text-xs text-forest/50">{arr.length} visit{arr.length === 1 ? "" : "s"}</div>
            </div>
            <div className="divide-y divide-[#E6E4DD]">
              {arr.map((v) => {
                const lead = leads.find((l) => l.id === v.lead_id);
                const project = projects.find((p) => p.id === v.project_id);
                const presalesOwner = users.find((u) => u.id === (v.presales_owner_id || v.assigned_to));
                const salesOwner = users.find((u) => u.id === v.sales_owner_id);
                const time = new Date(v.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={v.id} data-testid={VISIT.row(v.id)} className="px-5 py-4 flex items-center gap-4 hover:bg-bone-alt/30 transition-colors duration-100">
                    <div className="w-16 shrink-0">
                      <div className="font-display font-black text-2xl text-forest tabular-nums leading-none">{time}</div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-forest/50 mt-1">{relTime(v.scheduled_at)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      {lead ? (
                        <Link to={`/leads/${lead.id}`} className="font-medium text-forest hover:text-clay transition-colors duration-150">
                          {lead.name}
                        </Link>
                      ) : <span className="text-forest/50">Unknown lead</span>}
                      <div className="text-xs text-forest/60 mt-0.5 flex items-center gap-4">
                        {project && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {project.name}</span>}
                        {presalesOwner && <span className="inline-flex items-center gap-1"><User2 className="h-3 w-3" /> Pre-sales: {presalesOwner.name}</span>}
                        {salesOwner && <span className="inline-flex items-center gap-1"><User2 className="h-3 w-3" /> Sales: {salesOwner.name}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-[0.18em] font-bold rounded-sm px-2 py-1 border ${STATUS_TONE[v.status] || ""}`}>
                      {v.status.replace("_", " ")}
                    </span>
                    {v.status === "scheduled" && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateStatus(v.id, "completed")} className="text-xs px-2 h-8 rounded-sm border border-[#E6E4DD] text-forest hover:border-forest transition-colors duration-150">Mark done</button>
                        <button onClick={() => updateStatus(v.id, "no_show")} className="text-xs px-2 h-8 rounded-sm border border-[#E6E4DD] text-forest hover:border-forest transition-colors duration-150">No show</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="border border-dashed border-[#E6E4DD] rounded-sm p-12 text-center text-forest/50 text-sm">
            <CalendarClock className="h-6 w-6 mx-auto mb-2 opacity-60" />
            No visits scheduled.
          </div>
        )}
      </div>}
    </div>
  );
}

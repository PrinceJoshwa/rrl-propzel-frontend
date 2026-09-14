import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, asArray, formatApiError, relTime } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart3, ListFilter, Megaphone, PhoneCall, PhoneOutgoing, Play, Pause, Trash2, RefreshCcw, Search, Settings, Mail, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
  { key: "dashboard", label: "Dashboard", hint: "Calling performance", icon: BarChart3 },
  { key: "dialer", label: "Dialer", hint: "Click-to-call a lead", icon: PhoneOutgoing },
  { key: "campaigns", label: "Campaign Dialer", hint: "Bulk calling queue", icon: Megaphone },
  { key: "message-campaigns", label: "Message Campaigns", hint: "Email, SMS and WhatsApp", icon: MessageSquareText },
  { key: "logs", label: "Call Logs", hint: "Filter calls and SIDs", icon: ListFilter },
  { key: "settings", label: "Settings", hint: "Connection status", icon: Settings },
];

const STATUSES = ["all", "connected", "dnp", "busy", "failed", "initiated", "ringing", "completed"];

function statusLabel(status) {
  if (!status) return "Unknown";
  if (status === "dnp") return "DNP";
  return status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="border border-[#E6E4DD] bg-white rounded-sm p-5">
      <Icon className="h-5 w-5 text-forest/60 mb-4" />
      <div className="text-3xl font-display font-black text-forest">{value ?? 0}</div>
      <div className="text-xs uppercase tracking-[0.16em] text-forest/50 font-bold mt-1">{label}</div>
    </div>
  );
}

function FilterBar({ filters, setFilters, showDirection = true }) {
  return (
    <div className="grid md:grid-cols-4 gap-3">
      <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
        <SelectTrigger className="h-10 rounded-sm border-[#E6E4DD]"><SelectValue /></SelectTrigger>
        <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : statusLabel(s)}</SelectItem>)}</SelectContent>
      </Select>
      {showDirection && (
        <Select value={filters.direction} onValueChange={(v) => setFilters({ ...filters, direction: v })}>
          <SelectTrigger className="h-10 rounded-sm border-[#E6E4DD]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All directions</SelectItem>
            <SelectItem value="outgoing">Outgoing</SelectItem>
            <SelectItem value="incoming">Incoming</SelectItem>
          </SelectContent>
        </Select>
      )}
      <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" aria-label="Date from" />
      <input type="date" value={filters.date_to || ""} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" aria-label="Date to" />
      <div className="relative">
        <Search className="h-4 w-4 text-forest/35 absolute left-3 top-3" />
        <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Phone / Call SID" className="w-full h-10 border border-[#E6E4DD] rounded-sm pl-9 pr-3 text-sm focus:outline-none focus:border-forest" />
      </div>
    </div>
  );
}

function DashboardPanel({ stats, refresh }) {
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={refresh} className="h-9 px-3 border border-[#E6E4DD] rounded-sm text-sm inline-flex items-center gap-2 hover:border-forest"><RefreshCcw className="h-4 w-4" /> Refresh</button>
      </div>
      <div className="grid md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Stat label="Total calls today" value={stats.total_calls} icon={PhoneCall} />
        <Stat label="Connected" value={stats.connected} icon={PhoneOutgoing} />
        <Stat label="DNP" value={stats.dnp} icon={PhoneCall} />
        <Stat label="Failed / Busy" value={stats.failed} icon={PhoneCall} />
        <Stat label="Active campaigns" value={stats.active_campaigns} icon={Megaphone} />
        <Stat label="Pending campaign calls" value={stats.pending_campaign_calls} icon={ListFilter} />
      </div>
    </div>
  );
}

function DialerPanel({ leads, reload }) {
  const [leadId, setLeadId] = useState("");
  const selected = leads.find((l) => l.id === leadId);
  const call = async () => {
    if (!leadId) return toast.error("Choose a lead");
    try {
      const { data } = await api.post(`/leads/${leadId}/call`);
      toast.success(data.status === "pending_credentials" ? "CallerDesk credentials pending; call logged" : `Call started: ${statusLabel(data.status)}`);
      reload();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  return (
    <div className="border border-[#E6E4DD] bg-white rounded-sm p-5 max-w-2xl">
      <div className="label-caps">Click-to-call</div>
      <h3 className="font-display font-bold text-xl text-forest mt-1 mb-4">Start a CallerDesk call</h3>
      <Select value={leadId} onValueChange={setLeadId}>
        <SelectTrigger className="h-10 rounded-sm border-[#E6E4DD]"><SelectValue placeholder="Select lead" /></SelectTrigger>
        <SelectContent>{leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.name} · {l.phone || "No phone"}</SelectItem>)}</SelectContent>
      </Select>
      {selected && <div className="text-sm text-forest/60 mt-3">{selected.name} · {selected.phone}</div>}
      <button onClick={call} className="mt-4 h-10 px-4 rounded-sm bg-forest text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-forest-soft"><PhoneOutgoing className="h-4 w-4" /> Call lead</button>
    </div>
  );
}

function LogsPanel({ filters, setFilters, logs, loadLogs }) {
  return (
    <div className="space-y-4">
      <FilterBar filters={filters} setFilters={setFilters} />
      <div className="flex justify-end"><button onClick={loadLogs} className="h-9 px-3 border border-[#E6E4DD] rounded-sm text-sm inline-flex items-center gap-2 hover:border-forest"><RefreshCcw className="h-4 w-4" /> Apply</button></div>
      <div className="border border-[#E6E4DD] bg-white rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bone-alt/60 text-left text-[10px] uppercase tracking-[0.16em] text-forest/50">
            <tr><th className="p-3">Lead</th><th>Status</th><th>Direction</th><th>Phone</th><th>Call SID</th><th>Duration</th><th>Date</th></tr>
          </thead>
          <tbody className="divide-y divide-[#E6E4DD]">
            {logs.map((l) => (
              <tr key={l.id || l.call_sid}>
                <td className="p-3 font-medium text-forest">{l.lead_name || "Unknown"}</td>
                <td><span className="font-bold text-forest">{statusLabel(l.status)}</span></td>
                <td>{l.direction || "outgoing"}</td>
                <td>{l.phone_to || l.phone_from || "—"}</td>
                <td className="font-mono text-xs text-forest/60">{l.call_sid || "—"}</td>
                <td>{l.duration_sec || 0}s</td>
                <td>{relTime(l.created_at)}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-forest/50">No call logs found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CampaignsPanel({ leads, campaigns, loadCampaigns }) {
  const [name, setName] = useState("");
  const [numbers, setNumbers] = useState("");
  const [leadIds, setLeadIds] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [calls, setCalls] = useState([]);
  const [selectedCall, setSelectedCall] = useState(null);
  const [filters, setFilters] = useState({ status: "all", direction: "all", date_from: "", date_to: "", search: "" });
  const active = campaigns.find((c) => c.id === activeId) || campaigns[0];

  const create = async () => {
    try {
      await api.post("/callerdesk/campaigns", {
        name,
        lead_ids: leadIds,
        numbers: numbers.split(/[\n,]/).map((n) => n.trim()).filter(Boolean),
      });
      setName(""); setNumbers(""); setLeadIds([]);
      toast.success("Campaign created");
      loadCampaigns();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const action = async (id, type) => {
    try {
      await api.post(`/callerdesk/campaigns/${id}/${type}`);
      toast.success(type === "start" ? "Campaign batch started" : "Campaign paused");
      loadCampaigns();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const remove = async (id) => {
    if (!window.confirm("Cancel this campaign?")) return;
    await api.delete(`/callerdesk/campaigns/${id}`);
    loadCampaigns();
  };
  const loadCalls = async (id = active?.id) => {
    if (!id) return;
    const { data } = await api.get(`/callerdesk/campaigns/${id}/calls`, { params: { status: filters.status, search: filters.search, date_from: filters.date_from, date_to: filters.date_to } });
    setCalls(asArray(data));
  };
  useEffect(() => { if (active?.id) loadCalls(active.id); }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid xl:grid-cols-[360px_1fr] gap-5">
      <div className="border border-[#E6E4DD] bg-white rounded-sm p-5 space-y-4">
        <div><div className="label-caps">New campaign</div><h3 className="font-display font-bold text-xl text-forest mt-1">Campaign Dialer</h3></div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" className="w-full h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
        <select multiple value={leadIds} onChange={(e) => setLeadIds(Array.from(e.target.selectedOptions).map((o) => o.value))} className="w-full min-h-40 border border-[#E6E4DD] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-forest">
          {leads.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.phone || "No phone"}</option>)}
        </select>
        <textarea value={numbers} onChange={(e) => setNumbers(e.target.value)} placeholder="Or paste phone numbers, comma or line separated" className="w-full min-h-28 border border-[#E6E4DD] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-forest" />
        <button onClick={create} className="w-full h-10 bg-forest text-white rounded-sm text-sm font-medium hover:bg-forest-soft">Create campaign</button>
      </div>
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          {campaigns.map((c) => (
            <button key={c.id} onClick={() => setActiveId(c.id)} className={`text-left border rounded-sm p-4 bg-white ${active?.id === c.id ? "border-forest" : "border-[#E6E4DD]"}`}>
              <div className="flex items-start justify-between gap-2">
                <div><div className="font-display font-bold text-forest">{c.name}</div><div className="text-xs text-forest/50 mt-1">{statusLabel(c.status)} · {c.total_numbers || 0} numbers</div></div>
                <div className="flex gap-1">
                  <span onClick={(e) => { e.stopPropagation(); action(c.id, "start"); }} className="p-1.5 border border-[#E6E4DD] rounded-sm"><Play className="h-3.5 w-3.5" /></span>
                  <span onClick={(e) => { e.stopPropagation(); action(c.id, "pause"); }} className="p-1.5 border border-[#E6E4DD] rounded-sm"><Pause className="h-3.5 w-3.5" /></span>
                  <span onClick={(e) => { e.stopPropagation(); remove(c.id); }} className="p-1.5 border border-[#E6E4DD] rounded-sm text-clay"><Trash2 className="h-3.5 w-3.5" /></span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-forest/70">
                <div>DNP <b>{c.dnp_numbers || 0}</b></div>
                <div>Connected <b>{c.connected_numbers || 0}</b></div>
                <div>Pending <b>{c.pending_numbers || 0}</b></div>
              </div>
            </button>
          ))}
        </div>
        <FilterBar filters={filters} setFilters={setFilters} showDirection={false} />
        <div className="flex justify-end"><button onClick={() => loadCalls()} className="h-9 px-3 border border-[#E6E4DD] rounded-sm text-sm inline-flex items-center gap-2 hover:border-forest"><RefreshCcw className="h-4 w-4" /> Apply</button></div>
        <div className="border border-[#E6E4DD] bg-white rounded-sm divide-y divide-[#E6E4DD]">
          {calls.map((c) => <button key={c.id} onClick={() => setSelectedCall(c)} className="w-full p-3 text-sm flex justify-between gap-4 text-left hover:bg-bone-alt/60 transition-colors"><span>{c.lead_name || c.phone}</span><span className={`font-bold ${c.status === "connected" ? "text-emerald-700" : "text-forest"}`}>{statusLabel(c.status)}</span><span className="font-mono text-xs">{c.call_sid || "—"}</span></button>)}
          {calls.length === 0 && <div className="p-8 text-center text-forest/50 text-sm">No campaign calls selected.</div>}
        </div>
        <Dialog open={Boolean(selectedCall)} onOpenChange={(open) => !open && setSelectedCall(null)}>
          <DialogContent className="rounded-sm max-w-md">
            <DialogHeader><DialogTitle className="font-display text-2xl">Call outcome</DialogTitle></DialogHeader>
            {selectedCall && <div className="space-y-3 text-sm text-forest">
              <div className={`border rounded-sm p-4 ${selectedCall.status === "connected" ? "border-emerald-200 bg-emerald-50" : "border-[#E6E4DD] bg-bone-alt/40"}`}>
                <div className="label-caps mb-1">{statusLabel(selectedCall.status)}</div>
                <div className="font-display text-xl font-bold">{selectedCall.lead_name || selectedCall.phone}</div>
              </div>
              <div className="grid grid-cols-2 gap-3"><div><div className="label-caps">Phone</div><div>{selectedCall.phone || "—"}</div></div><div><div className="label-caps">Duration</div><div>{selectedCall.duration_sec || 0}s</div></div></div>
              <div><div className="label-caps">Call reference</div><div className="font-mono text-xs break-all">{selectedCall.call_sid || "Not available"}</div></div>
              {selectedCall.status === "connected" && <div className="text-xs text-emerald-800">Connected calls are highlighted here so the agent can record the next action immediately.</div>}
            </div>}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function MessageCampaignsPanel({ leads, campaigns, loadCampaigns }) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("whatsapp");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("all");
  const [leadIds, setLeadIds] = useState([]);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name.trim() || !message.trim()) return toast.error("Campaign name and message are required");
    setBusy(true);
    try {
      await api.post("/message-campaigns", {
        name: name.trim(), channel, subject: channel === "email" ? subject.trim() : undefined,
        message: message.trim(), lead_ids: leadIds, call_status: status,
      });
      setName(""); setSubject(""); setMessage(""); setLeadIds([]); setStatus("all");
      toast.success("Message campaign created");
      loadCampaigns();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  const action = async (id, type) => {
    try {
      if (type === "delete" && !window.confirm("Cancel this campaign?")) return;
      await (type === "delete" ? api.delete(`/message-campaigns/${id}`) : api.post(`/message-campaigns/${id}/${type}`));
      toast.success(type === "start" ? "Campaign started" : type === "pause" ? "Campaign paused" : "Campaign cancelled");
      loadCampaigns();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <div className="grid xl:grid-cols-[360px_1fr] gap-5">
      <div className="border border-[#E6E4DD] bg-white rounded-sm p-5 space-y-4">
        <div><div className="label-caps">New campaign</div><h3 className="font-display font-bold text-xl text-forest mt-1">Email, SMS or WhatsApp</h3></div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" className="w-full h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
        <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest">
          <option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">Email</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest">
          <option value="all">All leads</option><option value="dnp">CallerDesk DNP</option><option value="connected">CallerDesk connected</option><option value="busy">CallerDesk busy</option><option value="failed">CallerDesk failed</option>
        </select>
        <div className="text-xs text-forest/55">Choose specific leads for an individual campaign, or leave them unselected to use the status filter in bulk.</div>
        <select multiple value={leadIds} onChange={(e) => setLeadIds(Array.from(e.target.selectedOptions).map((o) => o.value))} className="w-full min-h-40 border border-[#E6E4DD] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-forest">
          {leads.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.phone || l.email || "No contact"}</option>)}
        </select>
        {channel === "email" && <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" className="w-full h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />}
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message" className="w-full min-h-28 border border-[#E6E4DD] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-forest" />
        {channel === "sms" && <div className="text-xs text-clay">SMS will remain pending until an SMS provider is configured.</div>}
        <button disabled={busy} onClick={create} className="w-full h-10 bg-forest text-white rounded-sm text-sm font-medium hover:bg-forest-soft disabled:opacity-50">{busy ? "Creating..." : "Create campaign"}</button>
      </div>
      <div className="space-y-4">
        {campaigns.map((c) => (
          <div key={c.id} className="border border-[#E6E4DD] bg-white rounded-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div><div className="font-display font-bold text-forest">{c.name}</div><div className="text-xs text-forest/55 mt-1">{c.channel.toUpperCase()} · {statusLabel(c.status)} · {c.call_status === "all" ? "All leads" : `CallerDesk ${statusLabel(c.call_status)}`}</div></div>
              <div className="flex gap-1"><button title="Start" onClick={() => action(c.id, "start")} className="p-1.5 border border-[#E6E4DD] rounded-sm"><Play className="h-3.5 w-3.5" /></button><button title="Pause" onClick={() => action(c.id, "pause")} className="p-1.5 border border-[#E6E4DD] rounded-sm"><Pause className="h-3.5 w-3.5" /></button><button title="Cancel" onClick={() => action(c.id, "delete")} className="p-1.5 border border-[#E6E4DD] rounded-sm text-clay"><Trash2 className="h-3.5 w-3.5" /></button></div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4 text-xs text-forest/70"><div>Total <b>{c.total || 0}</b></div><div>Sent <b>{c.sent || 0}</b></div><div>Pending <b>{c.pending || 0}</b></div><div>Failed <b>{c.failed || 0}</b></div></div>
          </div>
        ))}
        {campaigns.length === 0 && <div className="border border-[#E6E4DD] bg-white rounded-sm p-10 text-center text-forest/50">No message campaigns yet.</div>}
      </div>
    </div>
  );
}

export default function CallerDesk() {
  const params = useParams();
  const nav = useNavigate();
  const activeKey = params.feature || "dashboard";
  const [stats, setStats] = useState({});
  const [status, setStatus] = useState({});
  const [leads, setLeads] = useState([]);
  const [logs, setLogs] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [messageCampaigns, setMessageCampaigns] = useState([]);
  const [filters, setFilters] = useState({ status: "all", direction: "all", date_from: "", search: "" });
  const activeFeature = useMemo(() => FEATURES.find((f) => f.key === activeKey) || FEATURES[0], [activeKey]);

  const loadDashboard = async () => {
    const { data } = await api.get("/callerdesk/dashboard");
    setStats(data || {});
  };
  const loadStatus = async () => {
    const { data } = await api.get("/callerdesk/status");
    setStatus(data || {});
  };
  const loadLeads = async () => {
    const { data } = await api.get("/leads");
    setLeads(asArray(data));
  };
  const loadLogs = async () => {
    const params = { status: filters.status, direction: filters.direction, search: filters.search };
    if (filters.date_from) params.date_from = new Date(filters.date_from).toISOString();
    if (filters.date_to) params.date_to = new Date(`${filters.date_to}T23:59:59.999Z`).toISOString();
    const { data } = await api.get("/callerdesk/call-logs", { params });
    setLogs(asArray(data));
  };
  const loadCampaigns = async () => {
    const { data } = await api.get("/callerdesk/campaigns", { params: { status: filters.status, date_from: filters.date_from, date_to: filters.date_to, search: filters.search } });
    setCampaigns(asArray(data));
  };
  const loadMessageCampaigns = async () => {
    const { data } = await api.get("/message-campaigns");
    setMessageCampaigns(asArray(data));
  };

  useEffect(() => {
    Promise.all([loadDashboard(), loadStatus(), loadLeads(), loadLogs(), loadCampaigns(), loadMessageCampaigns()]).catch((e) => toast.error(formatApiError(e.response?.data?.detail)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-0 -m-6 min-h-[calc(100vh-73px)]">
      <aside className="border-r border-[#E6E4DD] bg-white p-5">
        <div className="label-caps mb-2">CallerDesk</div>
        <button onClick={() => nav("/callerdesk/dialer")} className="w-full h-12 bg-forest text-white rounded-sm text-sm font-medium inline-flex items-center justify-center gap-2 mb-5"><PhoneOutgoing className="h-4 w-4" /> Make call</button>
        <div className="space-y-1">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            const active = f.key === activeKey;
            return (
              <button key={f.key} onClick={() => nav(f.key === "dashboard" ? "/callerdesk" : `/callerdesk/${f.key}`)} className={`w-full flex items-center gap-3 rounded-sm px-3 py-3 text-left ${active ? "bg-bone-alt text-forest" : "text-forest/70 hover:bg-bone-alt/50"}`}>
                <span className="h-9 w-9 border border-[#E6E4DD] rounded-sm grid place-items-center bg-white"><Icon className="h-4 w-4" /></span>
                <span><span className="block font-medium text-sm">{f.label}</span><span className="block text-xs text-forest/50">{f.hint}</span></span>
              </button>
            );
          })}
        </div>
      </aside>
      <main className="p-6 space-y-6 overflow-x-hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="label-caps">Taskko / CallerDesk</div>
            <h2 className="font-display font-black text-3xl text-forest tracking-tight mt-1">{activeFeature.label}</h2>
            <div className="text-sm text-forest/60 mt-1">Campaign calling, call logs, DNP status and CallerDesk connection inside Taskko.</div>
          </div>
          <span className={`text-[10px] uppercase tracking-[0.16em] font-bold border rounded-sm px-2 py-1 ${status.configured ? "text-[#2D6A4F] border-[#2D6A4F]/30 bg-[#2D6A4F]/10" : "text-clay border-clay/30 bg-clay/10"}`}>{status.configured ? "Live" : "Pending credentials"}</span>
        </div>

        {activeKey === "dashboard" && <DashboardPanel stats={stats} refresh={loadDashboard} />}
        {activeKey === "dialer" && <DialerPanel leads={leads} reload={() => { loadLogs(); loadDashboard(); }} />}
        {activeKey === "campaigns" && <CampaignsPanel leads={leads} campaigns={campaigns} loadCampaigns={loadCampaigns} />}
        {activeKey === "message-campaigns" && <MessageCampaignsPanel leads={leads} campaigns={messageCampaigns} loadCampaigns={loadMessageCampaigns} />}
        {activeKey === "logs" && <LogsPanel filters={filters} setFilters={setFilters} logs={logs} loadLogs={loadLogs} />}
        {activeKey === "settings" && (
          <div className="border border-[#E6E4DD] bg-white rounded-sm p-5 text-sm text-forest/70 space-y-2">
            <div><b className="text-forest">Provider:</b> {status.provider || "pending"}</div>
            <div><b className="text-forest">Virtual number:</b> {status.virtual_number || "Not configured"}</div>
            <div><b className="text-forest">Webhook:</b> <code>{status.webhook_url}</code></div>
            <button onClick={() => nav("/settings")} className="h-9 px-4 bg-forest text-white rounded-sm text-sm font-medium mt-3">Open integration settings</button>
          </div>
        )}
      </main>
    </div>
  );
}

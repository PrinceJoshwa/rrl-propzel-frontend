import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, asArray, formatApiError, relTime } from "@/lib/api";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bot, Cable, Coins, FileDown, FileText, Layers, MessageCircle, MessageSquare,
  Plus, PlugZap, QrCode, RefreshCw, Send, Trash2, UserRound, Users,
} from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
  { key: "single", label: "Send Single Message", hint: "Send a quick message to a lead", icon: Send },
  { key: "profile", label: "Profile", hint: "WhatsApp account information", icon: UserRound },
  { key: "bulk", label: "Bulk messaging", hint: "Send to multiple recipients", icon: MessageSquare },
  { key: "autoresponder", label: "Autoresponder", hint: "Pre-written reply rules", icon: MessageCircle },
  { key: "chatbot", label: "Chatbot", hint: "Automation bots", icon: Bot },
  { key: "templates", label: "Templates", hint: "Create and manage templates", icon: Layers, to: "/whatsapp/templates" },
  { key: "export", label: "Export participants", hint: "Export conversation list", icon: FileDown },
  { key: "api", label: "API", hint: "WhatsApp REST connection", icon: Cable },
  { key: "forms", label: "Form Builder", hint: "WhatsApp lead capture forms", icon: FileText },
];

const FEATURE_KEYS = new Set(FEATURES.map((f) => f.key));

function StatCard({ icon: Icon, label, value, sub, tone }) {
  const tones = {
    violet: "bg-[#5B55E8] text-white",
    green: "bg-[#0EA66D] text-white",
    amber: "bg-[#E88900] text-white",
    pink: "bg-[#DB3A8B] text-white",
  };
  return (
    <div className={`relative overflow-hidden rounded-sm p-5 min-h-[150px] ${tones[tone] || tones.violet}`}>
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/12" />
      <div className="absolute right-8 -bottom-10 h-20 w-20 rounded-full bg-white/10" />
      <div className="relative h-10 w-10 rounded-sm bg-white/18 grid place-items-center mb-5">
        <Icon className="h-5 w-5" />
      </div>
      <div className="relative text-sm font-semibold text-white/85">{label}</div>
      <div className="relative mt-1 font-display font-black text-4xl leading-none tabular-nums">{value}</div>
      <div className="relative mt-3 inline-flex rounded-sm bg-white/18 px-2 py-1 text-xs font-bold">{sub}</div>
    </div>
  );
}

function SendDialog({ leads, onSent, children }) {
  const [open, setOpen] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!leadId || !text.trim()) return;
    setBusy(true);
    try {
      const r = await api.post("/whatsapp/messages", { lead_id: leadId, text: text.trim() });
      const status = r.data?.provider?.status;
      toast.success(status === "pending_provider" ? "Message saved; WhatsApp provider pending" : "Message sent");
      setOpen(false);
      setLeadId("");
      setText("");
      onSent?.();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-sm max-w-lg">
        <DialogHeader><DialogTitle className="font-display text-2xl">Send WhatsApp message</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <div className="label-caps mb-1.5">Lead</div>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger className="h-10 rounded-sm border-[#E6E4DD]"><SelectValue placeholder="Pick a lead" /></SelectTrigger>
              <SelectContent>
                {leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="label-caps mb-1.5">Message</div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="w-full border border-[#E6E4DD] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-forest" />
          </div>
        </div>
        <DialogFooter>
          <button onClick={submit} disabled={busy || !leadId || !text.trim()} className="h-9 px-4 rounded-sm bg-forest text-white text-sm font-medium hover:bg-forest-soft transition-colors duration-150 disabled:opacity-50">Send</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkSendDialog({ leads, onSent, children }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (selected.size === 0 || !text.trim()) return;
    setBusy(true);
    try {
      const r = await api.post("/whatsapp/bulk-send", { lead_ids: [...selected], text: text.trim() });
      toast.success(`Queued ${r.data.sent} WhatsApp message${r.data.sent === 1 ? "" : "s"}`);
      setOpen(false);
      setSelected(new Set());
      setText("");
      onSent?.();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-sm max-w-2xl">
        <DialogHeader><DialogTitle className="font-display text-2xl">Bulk WhatsApp send</DialogTitle></DialogHeader>
        <div className="grid md:grid-cols-[260px_1fr] gap-4">
          <div className="border border-[#E6E4DD] rounded-sm max-h-[320px] overflow-y-auto divide-y divide-[#E6E4DD]">
            {leads.map((l) => (
              <label key={l.id} className="flex items-center gap-2 px-3 py-2 text-sm text-forest cursor-pointer hover:bg-bone-alt/40">
                <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} />
                <span className="truncate">{l.name}</span>
              </label>
            ))}
          </div>
          <div>
            <div className="label-caps mb-1.5">Message</div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} className="w-full border border-[#E6E4DD] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-forest" />
          </div>
        </div>
        <DialogFooter>
          <button onClick={submit} disabled={busy || selected.size === 0 || !text.trim()} className="h-9 px-4 rounded-sm bg-forest text-white text-sm font-medium hover:bg-forest-soft transition-colors duration-150 disabled:opacity-50">Queue bulk send</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RulePanel({ title, items, endpoint, onChange }) {
  const [form, setForm] = useState({ name: "", keywords: "", reply_text: "", active: true });
  const save = async () => {
    if (!form.name.trim()) return;
    try {
      await api.post(endpoint, form);
      toast.success(`${title} saved`);
      setForm({ name: "", keywords: "", reply_text: "", active: true });
      onChange?.();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };
  const remove = async (id) => {
    try {
      await api.delete(`${endpoint}/${id}`);
      toast.success(`${title} deleted`);
      onChange?.();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };
  return (
    <section className="border border-[#E6E4DD] bg-white rounded-sm p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="label-caps">{title}</div>
          <h3 className="font-display font-bold text-xl text-forest mt-1">{title === "Autoresponder" ? "Pre-written reply rules" : "Automation bot rules"}</h3>
        </div>
        <span className="text-xs text-forest/50">{items.length} active</span>
      </div>
      <div className="grid md:grid-cols-4 gap-2 mb-4">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rule name" className="h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
        <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="Keywords comma separated" className="h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
        <input value={form.reply_text} onChange={(e) => setForm({ ...form, reply_text: e.target.value })} placeholder="Reply text" className="h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
        <button onClick={save} className="h-10 px-3 rounded-sm bg-forest text-white text-sm font-medium hover:bg-forest-soft inline-flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      <div className="divide-y divide-[#E6E4DD] border border-[#E6E4DD] rounded-sm overflow-hidden">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="font-medium text-forest truncate">{item.name}</div>
              <div className="text-xs text-forest/50 truncate">{item.keywords || "No keywords"} {item.reply_text ? `- ${item.reply_text}` : ""}</div>
            </div>
            <button onClick={() => remove(item.id)} className="h-8 w-8 rounded-sm border border-[#E6E4DD] grid place-items-center text-clay hover:border-clay" title="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <div className="text-sm text-forest/50 text-center py-8">No records yet.</div>}
      </div>
    </section>
  );
}

function FormsPanel({ forms, onChange }) {
  const [name, setName] = useState("");
  const save = async () => {
    if (!name.trim()) return;
    try {
      await api.post("/whatsapp/forms", { name: name.trim(), fields: ["name", "phone", "email"] });
      toast.success("WhatsApp form created");
      setName("");
      onChange?.();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };
  const remove = async (id) => {
    try {
      await api.delete(`/whatsapp/forms/${id}`);
      toast.success("Form deleted");
      onChange?.();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };
  return (
    <section className="border border-[#E6E4DD] bg-white rounded-sm p-5">
      <div className="label-caps">Form Builder</div>
      <h3 className="font-display font-bold text-xl text-forest mt-1 mb-4">WhatsApp lead capture forms</h3>
      <div className="flex gap-2 mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Form name" className="flex-1 h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
        <button onClick={save} className="h-10 px-3 rounded-sm bg-forest text-white text-sm font-medium hover:bg-forest-soft inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Add</button>
      </div>
      <div className="divide-y divide-[#E6E4DD] border border-[#E6E4DD] rounded-sm overflow-hidden">
        {forms.map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="font-medium text-forest truncate">{f.name}</div>
              <div className="text-xs text-forest/50 truncate">{f.webhook_url}</div>
            </div>
            <button onClick={() => remove(f.id)} className="h-8 w-8 rounded-sm border border-[#E6E4DD] grid place-items-center text-clay hover:border-clay" title="Delete"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {forms.length === 0 && <div className="text-sm text-forest/50 text-center py-8">No forms yet.</div>}
      </div>
    </section>
  );
}

export default function WhatsApp() {
  const navigate = useNavigate();
  const { feature: featureParam } = useParams();
  const [status, setStatus] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [profile, setProfile] = useState(null);
  const [apiInfo, setApiInfo] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [autoresponders, setAutoresponders] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [forms, setForms] = useState([]);
  const [qr, setQr] = useState(null);
  const [items, setItems] = useState([]);
  const [leads, setLeads] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const feature = FEATURE_KEYS.has(featureParam) ? featureParam : "dashboard";
  const activeFeature = FEATURES.find((f) => f.key === feature);

  const load = async () => {
    const [sr, ar, cr, lr, pr, air, cpr, arr, chr, fr] = await Promise.all([
      api.get("/whatsapp/status"),
      api.get("/whatsapp/analytics"),
      api.get("/whatsapp/conversations"),
      api.get("/leads"),
      api.get("/whatsapp/profile"),
      api.get("/whatsapp/api"),
      api.get("/whatsapp/campaigns"),
      api.get("/whatsapp/autoresponders"),
      api.get("/whatsapp/chatbots"),
      api.get("/whatsapp/forms"),
    ]);
    setStatus(sr.data);
    setAnalytics(ar.data);
    setProfile(pr.data);
    setApiInfo(air.data);
    setCampaigns(asArray(cpr.data));
    setAutoresponders(asArray(arr.data));
    setChatbots(asArray(chr.data));
    setForms(asArray(fr.data));
    const conversations = asArray(cr.data);
    setItems(conversations);
    setLeads(asArray(lr.data));
    if (!active && conversations[0]) setActive(conversations[0]);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!active?.id) return;
    api.get(`/whatsapp/conversations/${active.id}/messages`)
      .then((r) => setMessages(asArray(r.data)))
      .catch((e) => toast.error(formatApiError(e.response?.data?.detail)));
  }, [active]);

  const connect = async () => {
    try {
      const r = await api.post("/whatsapp/connect");
      if (r.data.status === "pending_credentials") toast.warning(r.data.message);
      else toast.success("WhatsApp service is ready to connect");
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const getQr = async () => {
    try {
      const r = await api.get("/whatsapp/qrcode");
      setQr(r.data);
      if (r.data.status === "pending_credentials") toast.warning(r.data.message);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const exportParticipants = () => {
    const rows = [["Name", "Phone", "Last Message", "Updated"]];
    items.forEach((c) => rows.push([c.contact_name || "", c.contact_phone || "", c.last_message || "", c.updated_at || ""]));
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "taskko-whatsapp-participants.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const featureContent = useMemo(() => {
    if (feature === "single") return (
      <section className="border border-[#E6E4DD] bg-white rounded-sm p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="label-caps">Send Single Message</div>
            <h3 className="font-display font-bold text-xl text-forest mt-1">Send a quick WhatsApp message to a lead</h3>
          </div>
          <SendDialog leads={leads} onSent={load}>
            <button className="h-10 px-4 rounded-sm bg-forest text-white text-sm font-medium hover:bg-forest-soft inline-flex items-center gap-2">
              <Send className="h-4 w-4" /> Send Message
            </button>
          </SendDialog>
        </div>
      </section>
    );
    if (feature === "bulk") return (
      <section className="border border-[#E6E4DD] bg-white rounded-sm p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <div className="label-caps">Bulk Messaging</div>
            <h3 className="font-display font-bold text-xl text-forest mt-1">Send to multiple recipients</h3>
          </div>
          <BulkSendDialog leads={leads} onSent={load}>
            <button className="h-10 px-4 rounded-sm bg-forest text-white text-sm font-medium hover:bg-forest-soft inline-flex items-center gap-2">
              <Layers className="h-4 w-4" /> Bulk Send
            </button>
          </BulkSendDialog>
        </div>
        <div className="divide-y divide-[#E6E4DD] border border-[#E6E4DD] rounded-sm overflow-hidden">
          {campaigns.map((c) => (
            <div key={c.id} className="px-4 py-3 text-sm">
              <div className="font-medium text-forest">{c.name || "Bulk campaign"}</div>
              <div className="text-xs text-forest/50 mt-1">Sent {c.sent || 0} | Failed {c.failed || 0} | Status {c.status || "queued"}</div>
            </div>
          ))}
          {campaigns.length === 0 && <div className="text-sm text-forest/50 text-center py-8">No bulk campaigns yet.</div>}
        </div>
      </section>
    );
    if (feature === "profile") return (
      <section className="border border-[#E6E4DD] bg-white rounded-sm p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="label-caps">Profile</div>
            <h3 className="font-display font-bold text-xl text-forest mt-1">WhatsApp account information</h3>
            <div className="text-sm text-forest/60 mt-2">Provider: {profile?.provider || "pending"} | Phone: {profile?.phone || "Not set"}</div>
            <div className="text-xs text-forest/45 mt-1">Instance: {profile?.instance_id || "Hidden or not configured"}</div>
          </div>
          <button onClick={getQr} className="h-10 px-3 rounded-sm border border-[#E6E4DD] bg-white text-forest text-sm font-medium hover:border-forest inline-flex items-center gap-2"><QrCode className="h-4 w-4" /> Get QR</button>
        </div>
        {qr?.base64 && <img src={qr.base64} alt="WhatsApp QR code" className="mt-4 h-48 w-48 border border-[#E6E4DD] rounded-sm" />}
        {qr && !qr.base64 && <pre className="mt-4 text-xs bg-bone-alt/60 border border-[#E6E4DD] rounded-sm p-3 overflow-auto">{JSON.stringify(qr, null, 2)}</pre>}
      </section>
    );
    if (feature === "autoresponder") return <RulePanel title="Autoresponder" items={autoresponders} endpoint="/whatsapp/autoresponders" onChange={load} />;
    if (feature === "chatbot") return <RulePanel title="Chatbot" items={chatbots} endpoint="/whatsapp/chatbots" onChange={load} />;
    if (feature === "api") return (
      <section className="border border-[#E6E4DD] bg-white rounded-sm p-5">
        <div className="label-caps">API</div>
        <h3 className="font-display font-bold text-xl text-forest mt-1 mb-4">WhatsApp REST connection</h3>
        <div className="grid md:grid-cols-2 gap-3 mb-4 text-sm">
          <div className="bg-bone-alt/50 rounded-sm p-3">Configured: <b>{apiInfo?.configured ? "Yes" : "No"}</b></div>
          <div className="bg-bone-alt/50 rounded-sm p-3">Instance: <b>{apiInfo?.instance_id || "Hidden / not set"}</b></div>
        </div>
        <div className="divide-y divide-[#E6E4DD] border border-[#E6E4DD] rounded-sm overflow-hidden">
          {(apiInfo?.endpoints || []).map((e) => (
            <div key={`${e.method}-${e.path}`} className="px-4 py-3 text-sm">
              <span className="font-mono text-xs bg-forest text-white rounded-sm px-2 py-1 mr-2">{e.method}</span>
              <span className="font-mono text-forest">{e.path}</span>
              <div className="text-xs text-forest/50 mt-1">{e.purpose}</div>
            </div>
          ))}
        </div>
      </section>
    );
    if (feature === "forms") return <FormsPanel forms={forms} onChange={load} />;
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature, profile, qr, autoresponders, chatbots, forms, apiInfo, leads, campaigns]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[310px_1fr] gap-6">
      <aside className="border border-[#E6E4DD] bg-white rounded-sm overflow-hidden">
        <div className="p-5 border-b border-[#E6E4DD]">
          <div className="relative">
            <input placeholder="Search" className="w-full h-10 rounded-sm border border-[#E6E4DD] bg-bone-alt/40 pl-9 pr-3 text-sm focus:outline-none focus:border-forest" />
            <MessageSquare className="h-4 w-4 absolute left-3 top-3 text-forest/40" />
          </div>
          <button onClick={connect} className="mt-4 w-full h-11 rounded-sm bg-[#DCFCE7] text-[#16864B] text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-[#CFF7DD] transition-colors duration-150">
            <PlugZap className="h-4 w-4" /> Add account
          </button>
        </div>
        <div className="p-5">
          <div className="label-caps mb-3">Features</div>
          <div className="space-y-1">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              const item = (
                <button onClick={() => f.key === "export" ? exportParticipants() : navigate(`/whatsapp/${f.key}`)} className={`w-full flex items-center gap-3 rounded-sm px-3 py-2.5 text-left transition-colors duration-150 ${feature === f.key ? "bg-bone-alt text-forest" : "hover:bg-bone-alt/60 text-forest/80"}`}>
                  <span className="h-9 w-9 rounded-sm border border-[#E6E4DD] grid place-items-center text-clay bg-white shrink-0"><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold truncate">{f.label}</span>
                    <span className="block text-xs text-forest/50 truncate">{f.hint}</span>
                  </span>
                </button>
              );
              return f.to ? <Link key={f.key} to={f.to}>{item}</Link> : <div key={f.key}>{item}</div>;
            })}
          </div>
        </div>
      </aside>

      <main className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display font-black text-3xl text-forest tracking-tight">{activeFeature?.label || "WhatsApp Analytics"}</h2>
              <span className={`text-[10px] uppercase tracking-[0.15em] font-bold rounded-sm px-2 py-1 ${status?.configured ? "bg-[#2D6A4F]/10 text-[#2D6A4F]" : "bg-clay/10 text-clay"}`}>
                {status?.configured ? "Live" : "Pending"}
              </span>
            </div>
            <div className="text-sm text-forest/60 mt-1">{activeFeature?.hint || "Overview of messaging performance and automation stats"}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="h-10 px-3 rounded-sm border border-[#E6E4DD] bg-white text-forest text-sm font-medium hover:border-forest inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <SendDialog leads={leads} onSent={load}>
              <button className="h-10 px-4 rounded-sm bg-forest text-white text-sm font-medium hover:bg-forest-soft inline-flex items-center gap-2">
                <Send className="h-4 w-4" /> Send Message
              </button>
            </SendDialog>
            <BulkSendDialog leads={leads} onSent={load}>
              <button className="h-10 px-4 rounded-sm border border-[#E6E4DD] bg-white text-forest text-sm font-medium hover:border-forest inline-flex items-center gap-2">
                <Layers className="h-4 w-4" /> Bulk Send
              </button>
            </BulkSendDialog>
          </div>
        </div>

        <section className="border border-[#9AE6B4] bg-[#F0FFF4] rounded-sm p-5 flex items-start gap-3">
          <Cable className="h-5 w-5 mt-0.5 text-[#2D6A4F]" />
          <div>
            <div className="font-display font-bold text-lg text-forest">Connect WhatsApp Cloud API</div>
            <div className="text-sm text-forest/70 mt-1">Use the extracted WhatsApp service or Meta Embedded Signup credentials to connect a WhatsApp Business account and phone number.</div>
          </div>
        </section>

        {feature === "dashboard" && (
          <div className="grid md:grid-cols-2 2xl:grid-cols-4 gap-4">
            <StatCard icon={Coins} label="Available Credits" value={(analytics?.available_credits ?? 0).toLocaleString()} sub={`Plan Limit: ${(analytics?.plan_limit ?? 0).toLocaleString()}`} tone="violet" />
            <StatCard icon={Send} label="Messages Sent" value={analytics?.messages_sent ?? 0} sub={`${analytics?.messages_this_month ?? 0} this month`} tone="violet" />
            <StatCard icon={Layers} label="Bulk Delivered" value={analytics?.bulk_delivered ?? 0} sub={`${analytics?.delivery_success_pct ?? 100}% success`} tone="green" />
            <StatCard icon={MessageCircle} label="Autoresponder" value={analytics?.autoresponder ?? 0} sub="active rules" tone="amber" />
            <StatCard icon={Bot} label="Chatbot" value={analytics?.chatbot ?? 0} sub="bots" tone="pink" />
            <StatCard icon={Users} label="Conversations" value={analytics?.conversations ?? 0} sub={`${analytics?.templates ?? 0} templates`} tone="green" />
          </div>
        )}

        {feature !== "dashboard" && featureContent && (
          <div>{featureContent}</div>
        )}

        {(feature === "dashboard" || feature === "single") && <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="border border-[#E6E4DD] bg-white rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E6E4DD] label-caps">Chats</div>
            <div className="divide-y divide-[#E6E4DD] max-h-[520px] overflow-y-auto">
              {items.map((c) => (
                <button key={c.id} onClick={() => setActive(c)} className={`w-full text-left px-4 py-3 hover:bg-bone-alt/40 ${active?.id === c.id ? "bg-bone-alt/60" : ""}`}>
                  <div className="font-medium text-forest truncate">{c.contact_name || "WhatsApp contact"}</div>
                  <div className="text-xs text-forest/50 truncate mt-0.5">{c.last_message || c.contact_phone || "No messages yet"}</div>
                </button>
              ))}
              {items.length === 0 && <div className="text-sm text-forest/50 py-12 text-center">No WhatsApp conversations yet.</div>}
            </div>
          </div>

          <div className="border border-[#E6E4DD] bg-white rounded-sm min-h-[420px]">
            {active ? (
              <>
                <div className="px-5 py-4 border-b border-[#E6E4DD]">
                  <div className="font-display font-bold text-xl text-forest">{active.contact_name || "WhatsApp contact"}</div>
                  <div className="text-xs text-forest/50">{active.contact_phone || "Linked to lead"}</div>
                </div>
                <div className="p-5 space-y-3 max-h-[460px] overflow-y-auto">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.direction === "outgoing" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-sm px-3 py-2 text-sm ${m.direction === "outgoing" ? "bg-forest text-white" : "bg-bone-alt text-forest"}`}>
                        <div>{m.text}</div>
                        <div className={`text-[10px] mt-1 ${m.direction === "outgoing" ? "text-white/60" : "text-forest/40"}`}>{relTime(m.created_at)}</div>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && <div className="text-sm text-forest/50 text-center py-20">No messages in this conversation.</div>}
                </div>
              </>
            ) : (
              <div className="h-full min-h-[420px] grid place-items-center text-forest/50">
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-60" />
                  Select a conversation
                </div>
              </div>
            )}
          </div>
        </div>}
      </main>
    </div>
  );
}

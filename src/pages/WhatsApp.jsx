import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, asArray, formatApiError, relTime } from "@/lib/api";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Layers, MessageSquare, PlugZap, RefreshCw, Send, Users, Search, MoreVertical, Paperclip, Smile, CheckCheck, Image as ImageIcon, FileText, Mic, Phone, Video, Star, Archive, UserRound,
} from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
  { key: "single", label: "Send Single Message", hint: "Send a quick message to a lead", icon: Send },
  { key: "bulk", label: "Bulk messaging", hint: "Send to multiple recipients", icon: MessageSquare },
  { key: "templates", label: "Templates", hint: "Create and manage templates", icon: Layers, to: "/whatsapp/templates" },
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

export default function WhatsApp() {
  const navigate = useNavigate();
  const { feature: featureParam } = useParams();
  const [status, setStatus] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [items, setItems] = useState([]);
  const [leads, setLeads] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [qrBusy, setQrBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const feature = FEATURE_KEYS.has(featureParam) ? featureParam : "dashboard";
  const activeFeature = FEATURES.find((f) => f.key === feature);

  const sendReply = async () => {
    if (!active?.lead_id || !draft.trim() || replyBusy) return;
    setReplyBusy(true);
    try {
      await api.post("/whatsapp/messages", { lead_id: active.lead_id, text: draft.trim() });
      setDraft("");
      const r = await api.get(`/whatsapp/conversations/${active.id}/messages`);
      setMessages(asArray(r.data));
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setReplyBusy(false); }
  };

  const load = async () => {
    const [sr, ar, cr, lr, cpr] = await Promise.all([
      api.get("/whatsapp/status"),
      api.get("/whatsapp/analytics"),
      api.get("/whatsapp/conversations"),
      api.get("/leads"),
      api.get("/whatsapp/campaigns"),
    ]);
    setStatus(sr.data);
    setAnalytics(ar.data);
    setCampaigns(asArray(cpr.data));
    const conversations = asArray(cr.data);
    setItems(conversations);
    setLeads(asArray(lr.data));
    if (!active && conversations[0]) setActive(conversations[0]);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  // Keep the inbox current when the provider delivers a webhook message.
  useEffect(() => {
    const timer = window.setInterval(() => { load().catch(() => {}); }, 5000);
    return () => window.clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active?.id) return;
    const refresh = () => api.get(`/whatsapp/conversations/${active.id}/messages`)
      .then((r) => setMessages(asArray(r.data)))
      .catch((e) => toast.error(formatApiError(e.response?.data?.detail)));
    refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => window.clearInterval(timer);
  }, [active]);

  const fetchQrCode = async () => {
    setQrBusy(true);
    try {
      const r = await api.get("/whatsapp/qrcode");
      const data = r.data;
      if (data?.status === "error") {
        if (/instance id has been used|already connected/i.test(data.message || "")) {
          toast.info("WhatsApp is already connected. No QR scan is required.");
          return;
        }
        throw new Error(data.message || "WhatsApp QR generation failed");
      }
      const value = data?.qrcode || data?.qr_code || data?.qr || data?.data?.qrcode || data?.data?.qr || (typeof data === "string" ? data : "");
      if (!value) throw new Error("The WhatsApp service did not return a QR code");
      setQrCode(value);
      setQrOpen(true);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || e.message);
    } finally {
      setQrBusy(false);
    }
  };

  const connect = async () => {
    try {
      const r = await api.post("/whatsapp/connect");
      if (r.data.status === "pending_credentials") {
        toast.warning(r.data.message);
      } else {
        toast.success("WhatsApp connection started");
        await fetchQrCode();
      }
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || e.message);
    }
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
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature, leads, campaigns]);

  return (
    <>
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
                <button onClick={() => navigate(`/whatsapp/${f.key}`)} className={`w-full flex items-center gap-3 rounded-sm px-3 py-2.5 text-left transition-colors duration-150 ${feature === f.key ? "bg-bone-alt text-forest" : "hover:bg-bone-alt/60 text-forest/80"}`}>
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
          <PlugZap className="h-5 w-5 mt-0.5 text-[#2D6A4F]" />
          <div>
            <div className="font-display font-bold text-lg text-forest">Admin WhatsApp connection</div>
            <div className="text-sm text-forest/70 mt-1">Propzel is configured to use the shared admin WhatsApp account from the existing Marketly service.</div>
          </div>
        </section>

        {feature === "dashboard" && (
          <div className="grid md:grid-cols-2 gap-4">
            <StatCard icon={Users} label="Conversations" value={analytics?.conversations ?? 0} sub={`${analytics?.templates ?? 0} templates`} tone="green" />
          </div>
        )}

        {feature !== "dashboard" && featureContent && (
          <div>{featureContent}</div>
        )}

        {(feature === "dashboard" || feature === "single") && <div className="grid grid-cols-1 xl:grid-cols-[290px_minmax(0,1fr)_240px] border border-[#DDE6E0] bg-white rounded-sm overflow-hidden min-h-[650px]">
          <aside className="border-r border-[#DDE6E0] min-w-0">
            <div className="p-3 border-b border-[#DDE6E0] bg-[#F7FAF8]"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-forest/40" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations" className="w-full h-9 rounded-sm border border-[#DDE6E0] bg-white pl-9 pr-3 text-sm focus:outline-none focus:border-forest" /></div><div className="flex items-center justify-between mt-3"><span className="label-caps">Inbox</span><span className="text-xs text-forest/50">{items.length} chats</span></div></div>
            <div className="divide-y divide-[#E8EEE9] max-h-[590px] overflow-y-auto">{items.filter((c) => `${c.contact_name || ""} ${c.contact_phone || ""}`.toLowerCase().includes(search.toLowerCase())).map((c) => <button key={c.id} onClick={() => setActive(c)} className={`w-full text-left p-3 flex gap-3 hover:bg-[#F3F8F4] ${active?.id === c.id ? "bg-[#E8F4EC] border-l-2 border-[#18A66A]" : ""}`}><div className="h-10 w-10 rounded-full bg-[#D8F3E3] text-[#16864B] grid place-items-center font-bold shrink-0">{(c.contact_name || "W").slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><span className="font-semibold text-sm text-forest truncate">{c.contact_name || "WhatsApp contact"}</span><span className="text-[10px] text-forest/40">{relTime(c.last_message_at || c.updated_at)}</span></div><div className="text-xs text-forest/55 truncate mt-1">{c.last_message || c.contact_phone || "No messages yet"}</div><div className="flex items-center gap-2 mt-1"><span className="text-[10px] text-forest/40">{c.contact_phone || ""}</span>{c.unread_count > 0 && <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-[#18A66A] text-white text-[10px] grid place-items-center">{c.unread_count}</span>}</div></div></button>)}{items.length === 0 && <div className="text-sm text-forest/50 py-12 text-center px-4">No WhatsApp conversations yet.</div>}</div>
          </aside>
          <section className="min-w-0 flex flex-col bg-[#F7FAF8]">
            {active ? <><header className="h-[68px] px-4 border-b border-[#DDE6E0] bg-white flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-[#D8F3E3] text-[#16864B] grid place-items-center font-bold">{(active.contact_name || "W").slice(0, 1).toUpperCase()}</div><div><div className="font-semibold text-forest">{active.contact_name || "WhatsApp contact"}</div><div className="text-xs text-forest/50">{active.contact_phone || "WhatsApp contact"}</div></div></div><div className="flex items-center gap-1 text-forest/50"><button title="Search messages" className="h-8 w-8 grid place-items-center hover:bg-bone-alt rounded-sm"><Search className="h-4 w-4" /></button><button title="More actions" className="h-8 w-8 grid place-items-center hover:bg-bone-alt rounded-sm"><MoreVertical className="h-4 w-4" /></button></div></header><div className="flex-1 p-5 space-y-2 overflow-y-auto" style={{ backgroundImage: "radial-gradient(#DDE6E0 0.7px, transparent 0.7px)", backgroundSize: "14px 14px" }}>{messages.map((m) => { const outgoing = m.direction === "outgoing"; const media = m.media_url || m.provider_response?.media_url; const type = m.message_type || m.type; return <div key={m.id} className={`flex ${outgoing ? "justify-end" : "justify-start"}`}><div className={`max-w-[78%] px-3 py-2 rounded-lg shadow-sm ${outgoing ? "bg-[#D9FDD3] text-[#173B25] rounded-tr-sm" : "bg-white text-forest rounded-tl-sm"}`}>{media && type === "image" ? <img src={media} alt="WhatsApp attachment" className="max-h-56 max-w-full rounded-md mb-1 object-contain" /> : media ? <a href={media} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm underline"><FileText className="h-4 w-4" /> Open attachment</a> : null}{m.text && <div className="text-sm whitespace-pre-wrap">{m.text}</div>}<div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-forest/45">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{outgoing && <CheckCheck className="h-3 w-3 text-[#16864B]" />}</div></div></div>})}{messages.length === 0 && <div className="text-center text-sm text-forest/45 py-24">No messages in this conversation.</div>}</div><div className="px-3 py-3 border-t border-[#DDE6E0] bg-white"><div className="flex items-end gap-2"><button title="Attach file" className="h-10 w-10 grid place-items-center text-forest/55 hover:bg-bone-alt rounded-full"><Paperclip className="h-5 w-5" /></button><button title="Add emoji" className="h-10 w-10 grid place-items-center text-forest/55 hover:bg-bone-alt rounded-full"><Smile className="h-5 w-5" /></button><textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }} rows={1} placeholder="Type a message" className="flex-1 max-h-28 min-h-10 resize-none rounded-full border border-[#DDE6E0] px-4 py-2.5 text-sm focus:outline-none focus:border-[#18A66A]" /><button title="Send message" onClick={sendReply} disabled={replyBusy || !draft.trim()} className="h-10 w-10 rounded-full bg-[#18A66A] text-white grid place-items-center disabled:opacity-50"><Send className="h-4 w-4" /></button></div></div></> : <div className="flex-1 grid place-items-center text-forest/45"><div className="text-center"><MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />Select a conversation to start chatting</div></div>}
          </section>
          <aside className="border-l border-[#DDE6E0] bg-white p-4 hidden xl:block">{active ? <><div className="flex flex-col items-center text-center py-4 border-b border-[#E8EEE9]"><div className="h-16 w-16 rounded-full bg-[#D8F3E3] text-[#16864B] grid place-items-center text-2xl font-bold">{(active.contact_name || "W").slice(0, 1).toUpperCase()}</div><div className="font-semibold text-forest mt-3">{active.contact_name || "WhatsApp contact"}</div><div className="text-xs text-forest/50 mt-1">{active.contact_phone || "No phone number"}</div></div><div className="py-4 space-y-3"><div className="label-caps">Conversation</div><div className="flex items-center gap-2 text-sm text-forest/70"><UserRound className="h-4 w-4" /> {active.lead_id ? "Linked CRM lead" : "Unassigned contact"}</div><div className="flex items-center gap-2 text-sm text-forest/70"><Archive className="h-4 w-4" /> {messages.length} messages</div><div className="flex items-center gap-2 text-sm text-forest/70"><Star className="h-4 w-4" /> {active.unread_count || 0} unread</div></div></> : <div className="text-sm text-forest/45 text-center py-10">Contact details appear here</div>}</aside>
        </div>}
      </main>
    </div>
    <Dialog open={qrOpen} onOpenChange={setQrOpen}>
      <DialogContent className="rounded-sm max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Connect WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4">
          <p className="text-sm text-forest/60">Open WhatsApp on your phone and scan this QR code from Linked devices.</p>
          <div className="min-h-[280px] grid place-items-center border border-[#E6E4DD] bg-white rounded-sm p-4">
            {qrBusy ? <RefreshCw className="h-8 w-8 animate-spin text-forest/50" /> : (
              <img
                src={qrCode.startsWith("data:") || qrCode.startsWith("http") ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="WhatsApp connection QR code"
                className="h-64 w-64 object-contain"
              />
            )}
          </div>
          <button onClick={fetchQrCode} disabled={qrBusy} className="h-10 px-4 rounded-sm border border-[#E6E4DD] bg-white text-forest text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${qrBusy ? "animate-spin" : ""}`} /> Refresh QR
          </button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

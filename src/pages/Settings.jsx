import React, { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { SETTINGS } from "@/constants/testIds";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MessageSquare, Mail, Calendar as CalIcon, Zap, Globe, PhoneCall, CheckCircle2 } from "lucide-react";

export default function Settings() {
  const [s, setS] = useState(null);
  const [calling, setCalling] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [sr, tr] = await Promise.all([api.get("/settings"), api.get("/calling/status")]);
    setS(sr.data);
    setCalling(tr.data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    try {
      const payload = { ...s };
      delete payload.id;
      await api.patch("/settings", payload);
      toast.success("Settings saved");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  if (!s || !calling) return <div className="text-forest/50 text-sm">Loading…</div>;

  const set = (k, v) => setS({ ...s, [k]: v });
  const webhookBase = `${process.env.REACT_APP_BACKEND_URL}/api/webhooks/leads`;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="label-caps">Settings</div>
        <h2 className="font-display font-black text-3xl text-forest tracking-tight mt-1">
          Integrations & automation
        </h2>
      </div>

      <section className="border border-[#E6E4DD] bg-white rounded-sm p-6 space-y-5">
        <Row
          icon={Zap}
          title="Auto-assign new leads"
          hint="Route each incoming lead to the executive with the fewest open leads."
          testId={SETTINGS.toggleAutoAssign}
          checked={!!s.auto_assign_enabled}
          onChange={(v) => set("auto_assign_enabled", v)}
        />
        <Row
          icon={Zap}
          title="Auto-follow-up on missed calls & scheduled visits"
          hint="Create a follow-up task automatically when a call goes unanswered or a visit is booked."
          testId={SETTINGS.toggleAutoFollowup}
          checked={!!s.auto_followup_enabled}
          onChange={(v) => set("auto_followup_enabled", v)}
        />
      </section>

      <section className="border border-[#E6E4DD] bg-white rounded-sm p-6 space-y-5">
        <div>
          <div className="font-display font-bold text-xl text-forest tracking-tight">Channels</div>
            <div className="text-xs text-forest/60 mt-1">Enable outbound channels. Credentials are required for live delivery.</div>
        </div>

        <Row
          icon={MessageSquare}
          title="WhatsApp"
          hint="Send drip nudges, site-visit reminders and follow-ups via WhatsApp."
          testId={SETTINGS.toggleWhatsapp}
          checked={!!s.whatsapp_enabled}
          onChange={(v) => set("whatsapp_enabled", v)}
        />
        {s.whatsapp_enabled && (
          <div className="pl-11">
            <div className="label-caps mb-1.5">Business number</div>
            <input value={s.whatsapp_number || ""} onChange={(e) => set("whatsapp_number", e.target.value)} placeholder="+91 90000 00000" className="w-full max-w-md h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div>
                <div className="label-caps mb-1.5">Service URL</div>
                <input value={s.whatsapp_service_url || ""} onChange={(e) => set("whatsapp_service_url", e.target.value)} placeholder="https://wa-service.example.com" className="w-full h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
              </div>
              <div>
                <div className="label-caps mb-1.5">Instance ID</div>
                <input value={s.whatsapp_instance_id || ""} onChange={(e) => set("whatsapp_instance_id", e.target.value)} placeholder="Propzel WhatsApp instance" className="w-full h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
              </div>
            </div>
            <div className="mt-3">
              <div className="label-caps mb-1.5">Access token</div>
              <input type="password" value={s.whatsapp_access_token || ""} onChange={(e) => set("whatsapp_access_token", e.target.value)} placeholder="Provided by WhatsApp service" className="w-full max-w-md h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
            </div>
          </div>
        )}

        <Row
          icon={Mail}
          title="Email (Resend)"
          hint="Transactional + drip emails. Add your Resend API key on the server to go live."
          testId={SETTINGS.toggleEmail}
          checked={!!s.email_enabled}
          onChange={(v) => set("email_enabled", v)}
        />
        {s.email_enabled && (
          <div className="pl-11">
            <div className="label-caps mb-1.5">From address</div>
            <input value={s.resend_from_email || ""} onChange={(e) => set("resend_from_email", e.target.value)} placeholder="sales@propzel.com" className="w-full max-w-md h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
          </div>
        )}

        <Row
          icon={CalIcon}
          title="Google Calendar reminders"
          hint="Push site-visit events to your team's calendars with automatic reminders."
          testId={SETTINGS.toggleCalendar}
          checked={!!s.google_calendar_enabled}
          onChange={(v) => set("google_calendar_enabled", v)}
        />
        {s.google_calendar_enabled && (
          <div className="pl-11 grid md:grid-cols-2 gap-3">
            <div>
              <div className="label-caps mb-1.5">Calendar ID</div>
              <input value={s.google_calendar_id || ""} onChange={(e) => set("google_calendar_id", e.target.value)} placeholder="primary or calendar id" className="w-full h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
            </div>
            <div>
              <div className="label-caps mb-1.5">Credentials JSON</div>
              <input type="password" value={s.google_calendar_credentials_json || ""} onChange={(e) => set("google_calendar_credentials_json", e.target.value)} placeholder="Client/service-account JSON" className="w-full h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
            </div>
          </div>
        )}
      </section>

      <section className="border border-[#E6E4DD] bg-white rounded-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <PhoneCall className="h-4 w-4 mt-1 text-forest/60" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="font-display font-bold text-xl text-forest tracking-tight">Calling provider</div>
              {calling?.configured ? (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] font-bold text-[#2D6A4F] bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 rounded-sm px-2 py-0.5">
                  <CheckCircle2 className="h-3 w-3" /> Live
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-clay bg-clay/10 border border-clay/30 rounded-sm px-2 py-0.5">Pending credentials</span>
              )}
            </div>
            <div className="text-xs text-forest/60 mt-1">
              Propzel uses CallerDesk for click-to-call, callbacks, campaigns, and call logs.
            </div>
          </div>
        </div>

        <div className="pl-7 mb-5">
          <div className="label-caps mb-1.5">Provider</div>
          <Select value={s.calling_provider || "pending"} onValueChange={(v) => set("calling_provider", v)}>
            <SelectTrigger className="w-56 h-10 rounded-sm border-[#E6E4DD]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending client API</SelectItem>
              <SelectItem value="callerdesk">CallerDesk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {s.calling_provider === "callerdesk" && (
          <div className="pl-7 mb-5 grid md:grid-cols-2 gap-3">
            <div>
              <div className="label-caps mb-1.5">CallerDesk base URL</div>
              <input value={s.callerdesk_base_url || ""} onChange={(e) => set("callerdesk_base_url", e.target.value)} placeholder="https://app.callerdesk.io/api" className="w-full h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
            </div>
            <div>
              <div className="label-caps mb-1.5">Virtual / desk phone</div>
              <input value={s.callerdesk_virtual_number || ""} onChange={(e) => set("callerdesk_virtual_number", e.target.value)} placeholder="CallerDesk DID / deskphone" className="w-full h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
            </div>
            <div>
              <div className="label-caps mb-1.5">Authcode</div>
              <input type="password" value={s.callerdesk_authcode || ""} onChange={(e) => set("callerdesk_authcode", e.target.value)} placeholder="Provided by CallerDesk" className="w-full h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
            </div>
            <div>
              <div className="label-caps mb-1.5">Webhook secret</div>
              <input type="password" value={s.callerdesk_webhook_secret || ""} onChange={(e) => set("callerdesk_webhook_secret", e.target.value)} placeholder="Optional shared secret" className="w-full h-10 border border-[#E6E4DD] rounded-sm px-3 text-sm focus:outline-none focus:border-forest" />
            </div>
          </div>
        )}

        {calling?.configured && (
          <div className="grid md:grid-cols-2 gap-2 mb-5 text-xs">
            <div className="border border-[#E6E4DD] rounded-sm px-3 py-2 flex items-center justify-between">
              <span className="uppercase tracking-[0.15em] font-bold text-forest/60">Caller ID</span>
              <code className="text-forest">{calling.from_number}</code>
            </div>
            <div className="border border-[#E6E4DD] rounded-sm px-3 py-2 flex items-center justify-between">
              <span className="uppercase tracking-[0.15em] font-bold text-forest/60">Webhook base</span>
              <code className="text-forest truncate max-w-[240px]">{calling.webhook_base}</code>
            </div>
          </div>
        )}

        <Row
          icon={Zap}
          title="Auto-call on new lead"
          hint="When a fresh lead is assigned, Propzel asks the configured calling provider to ring the owner."
          testId="settings-toggle-autocall"
          checked={!!s.auto_call_on_new_lead}
          onChange={(v) => set("auto_call_on_new_lead", v)}
        />

        <div className="mt-5 pt-5 border-t border-[#E6E4DD]">
          <Row
            icon={Zap}
            title="Auto follow-up on missed / no-answer calls"
            hint="If the calling provider reports the lead did not pick up, Propzel creates a follow-up automatically."
            testId="settings-toggle-missed-followup"
            checked={!!s.missed_call_followup_enabled}
            onChange={(v) => set("missed_call_followup_enabled", v)}
          />
          {s.missed_call_followup_enabled && (
            <div className="pl-11 mt-3">
              <div className="label-caps mb-1.5">Schedule next call after…</div>
              <Select
                value={String(s.missed_call_followup_hours ?? (1 / 6))}
                onValueChange={(v) => set("missed_call_followup_hours", Number(v))}
              >
                <SelectTrigger data-testid="settings-missed-hours" className="w-56 h-10 rounded-sm border-[#E6E4DD]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.16666666666666666">10 minutes</SelectItem>
                  <SelectItem value="0.25">15 minutes</SelectItem>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="8">8 hours</SelectItem>
                  <SelectItem value="24">1 day (recommended)</SelectItem>
                  <SelectItem value="48">2 days</SelectItem>
                  <SelectItem value="72">3 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {!calling?.configured && (
          <div className="mt-5 text-xs text-forest/50">
            Add the current CallerDesk credentials to activate live click-to-call.
          </div>
        )}
      </section>

      <section className="border border-[#E6E4DD] bg-white rounded-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <PhoneCall className="h-4 w-4 mt-1 text-forest/60" />
          <div>
            <div className="font-display font-bold text-xl text-forest tracking-tight">Calling & SMS replacement</div>
            <div className="text-xs text-forest/60 mt-1">
            CallerDesk powers click-to-call, callbacks, campaign dialing, and call logs.
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { name: "CallerDesk", tag: s.calling_provider === "callerdesk" ? "Selected provider" : "Available", url: "https://api.callerdesk.io", active: s.calling_provider === "callerdesk" },
            { name: "SMS provider", tag: "Awaiting client details", url: "#" },
          ].map((p) => (
            <a key={p.name} href={p.url} target="_blank" rel="noreferrer" className={`border rounded-sm p-4 transition-colors duration-150 ${p.active ? "border-forest bg-forest/5" : "border-[#E6E4DD] hover:border-forest"}`}>
              <div className="flex items-center gap-2">
                <div className="font-display font-bold text-forest">{p.name}</div>
                {p.active && <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-[#2D6A4F]">Active</span>}
              </div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-forest/50 mt-1">{p.tag}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="border border-[#E6E4DD] bg-white rounded-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <Globe className="h-4 w-4 mt-1 text-forest/60" />
          <div>
            <div className="font-display font-bold text-xl text-forest tracking-tight">Lead capture webhooks</div>
            <div className="text-xs text-forest/60 mt-1">Point MagicBricks / 99acres / CommonFloor / Google Ads / Meta lead-gen webhooks to these URLs. Payload fields <code>name, phone, email, project, budget_min, budget_max, configuration, location, message</code>.</div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {["magicbricks", "99acres", "commonfloor", "housing", "website", "jagathi_website", "google_ads", "facebook", "instagram"].map((src) => (
            <div key={src} className="border border-[#E6E4DD] rounded-sm px-3 py-2 flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-forest/60 w-24 shrink-0">{src}</span>
              <code className="text-[11px] text-forest/80 truncate flex-1">{webhookBase}/{src}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(`${webhookBase}/${src}`); toast.success("Copied"); }}
                className="text-[10px] uppercase tracking-[0.15em] font-bold text-forest hover:text-clay transition-colors duration-150"
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          data-testid={SETTINGS.saveBtn}
          onClick={save}
          disabled={busy}
          className="h-10 px-5 rounded-sm bg-forest text-white text-sm font-medium hover:bg-forest-soft transition-colors duration-150 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}

function Row({ icon: Icon, title, hint, testId, checked, onChange }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-sm border border-[#E6E4DD] grid place-items-center text-forest/70 shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-forest">{title}</div>
        <div className="text-xs text-forest/60 mt-0.5">{hint}</div>
      </div>
      <Switch data-testid={testId} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

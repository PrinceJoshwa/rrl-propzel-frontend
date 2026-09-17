import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AUTH } from "@/constants/testIds";
import { ArrowUpRight } from "lucide-react";

export default function Login() {
  const { user, login, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (user && user !== false) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await login(email, password);
    setBusy(false);
    if (ok) navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-bone">
      {/* Left brand panel */}
      <div className="relative hidden md:flex flex-col justify-between p-12 bg-forest text-white grain overflow-hidden">
        <div className="relative z-10">
          <img src="/propzel-logo.jpeg" alt="Propzel" className="h-16 w-auto max-w-[260px] object-contain object-left rounded-sm bg-white px-3 py-1" />
        </div>

        <div className="relative z-10 max-w-md">
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/50 mb-4">Built for pre-sales</div>
          <h2 className="font-display font-black text-5xl leading-[1.05] tracking-tight">
            Every lead.<br />
            Every project.<br />
            <span className="text-wheat">One workspace.</span>
          </h2>
          <p className="text-white/70 mt-6 text-sm leading-relaxed max-w-sm">
            Capture leads from MagicBricks, 99acres, Google & Meta. Route them to the right
            executive. Move them through your funnel with WhatsApp, email & site visits — without
            leaving Propzel.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] text-white/40">
          <div>
            <div className="text-white text-2xl font-display font-bold tracking-tight">10+</div>
            <div className="mt-1">Lead sources</div>
          </div>
          <div>
            <div className="text-white text-2xl font-display font-bold tracking-tight">3</div>
            <div className="mt-1">Access tiers</div>
          </div>
          <div>
            <div className="text-white text-2xl font-display font-bold tracking-tight">∞</div>
            <div className="mt-1">Projects</div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 md:p-16">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-8">
            <img src="/propzel-logo.jpeg" alt="Propzel" className="h-11 w-auto max-w-[220px] object-contain object-left" />
          </div>

          <div className="text-[10px] uppercase tracking-[0.22em] text-forest/50">Sign in</div>
          <h1 className="font-display font-black text-4xl text-forest tracking-tight mt-2">
            Welcome back.
          </h1>
          <p className="text-sm text-forest/60 mt-3">
            Sign in to access your Propzel workspace.
          </p>

          <form onSubmit={submit} className="mt-10 space-y-5">
            <div>
              <label className="label-caps block mb-2">Email</label>
              <input
                data-testid={AUTH.loginEmail}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3 border border-[#E6E4DD] bg-white rounded-sm text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors duration-150"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="label-caps block mb-2">Password</label>
              <input
                data-testid={AUTH.loginPassword}
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3 border border-[#E6E4DD] bg-white rounded-sm text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors duration-150"
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <div
                data-testid={AUTH.loginError}
                className="text-sm text-clay bg-clay/5 border border-clay/20 rounded-sm px-3 py-2"
              >
                {error}
              </div>
            ) : null}

            <button
              data-testid={AUTH.loginSubmit}
              disabled={busy}
              type="submit"
              className="group w-full h-11 rounded-sm bg-forest text-white font-medium text-sm inline-flex items-center justify-center gap-2 hover:bg-forest-soft transition-colors duration-150 disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Enter workspace"}
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

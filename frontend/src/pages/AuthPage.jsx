import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Layers3 } from "lucide-react";
import Brand from "../components/Brand";
import { useAuth } from "../context/AuthContext";
export default function AuthPage({ register = false }) {
  const { authenticate } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await authenticate(register ? "register" : "login", body);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="flex flex-col px-6 py-8 sm:px-16 lg:px-20">
        <Brand />
        <div className="w-full max-w-sm m-auto py-16">
          <span className="eyebrow">YOUR DAY, A LITTLE CLEARER</span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            {register ? "Make room for progress." : "Welcome back."}
          </h1>
          <p className="text-slate-500 mt-3 mb-9">
            {register
              ? "Create your account and take the first step."
              : "Sign in to pick up where you left off."}
          </p>
          <form onSubmit={submit} className="space-y-5">
            {register && (
              <label className="field">
                Full name
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  required
                  maxLength={80}
                />
              </label>
            )}
            <label className="field">
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                maxLength={254}
              />
            </label>
            <label className="field">
              Password
              <input
                name="password"
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                placeholder={
                  register ? "At least 8 characters" : "Enter your password"
                }
                required
                minLength={8}
              />
            </label>
            {register && (
              <p className="text-xs text-slate-500">
                Use at least 8 characters (up to 72 UTF-8 bytes).
              </p>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className="btn-primary w-full justify-center"
            >
              {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-7">
            {register ? "Already have an account? " : "New to Taskflow? "}
            <Link
              className="font-semibold text-blue-600 hover:underline"
              to={register ? "/login" : "/register"}
              onClick={() => setError("")}
            >
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
        <p className="text-xs text-slate-400">
          A little structure. A lot more headspace.
        </p>
      </section>
      <aside className="hidden lg:flex bg-blue-50 relative overflow-hidden items-center justify-center p-16">
        <div className="absolute size-[600px] rounded-full border border-blue-100" />
        <div className="absolute size-[450px] rounded-full border border-blue-100" />
        <div className="relative max-w-md">
          <div className="flex items-center gap-2 text-blue-600 mb-6">
            <Layers3 size={23} />
            <span className="eyebrow">SMALL STEPS. REAL PROGRESS.</span>
          </div>
          <h2 className="text-5xl leading-tight font-bold tracking-tight text-slate-900">
            Less juggling.
            <br />
            More doing.
          </h2>
          <p className="text-slate-500 leading-relaxed mt-5">
            Bring your tasks together in one calm place, so you can focus on
            what matters today.
          </p>
          <div className="mt-10 bg-white rounded-2xl border border-blue-100 p-6 shadow-xl shadow-blue-900/5 -rotate-2">
            <div className="flex justify-between text-xs text-slate-400 mb-5">
              <span>TODAY’S LITTLE WINS</span>
              <span>2 of 3</span>
            </div>
            {[
              "Make a plan for the day",
              "Take the first small step",
              "Keep the momentum going",
            ].map((text, index) => (
              <div key={text} className="flex items-center gap-3 py-3 text-sm">
                <CheckCircle2
                  size={21}
                  className={index < 2 ? "text-blue-600" : "text-slate-300"}
                />
                <span
                  className={
                    index < 2 ? "line-through text-slate-400" : "text-slate-700"
                  }
                >
                  {text}
                </span>
              </div>
            ))}
            <div className="h-1.5 bg-blue-50 rounded mt-4">
              <div className="h-full w-2/3 bg-blue-500 rounded" />
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}

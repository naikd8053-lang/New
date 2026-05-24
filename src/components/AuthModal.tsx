import React, { useState } from "react";
import safeJson from "../utils/safeJson";
import { LogIn, Key, Mail, Sparkles, User, UserPlus, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthModalProps {
  onAuthSuccess: (token: string, user: { id: string; email: string; name: string }) => void;
}

export default function AuthModal({ onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("demo@myfitnesspal.com");
  const [password, setPassword] = useState("password");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("1995-06-15");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [height, setHeight] = useState("178");
  const [weight, setWeight] = useState("75");
  const [activity, setActivity] = useState("moderate");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin 
      ? { email, password } 
      : { email, password, name, dob, gender, height_cm: Number(height), weight_kg: Number(weight), activity_level: activity };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error((data && data.error) || "Authentication failed.");
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Network credentials rejected.");
    } finally {
      setLoading(false);
    }
  }

  function handleAutoFillDemo() {
    setEmail("demo@myfitnesspal.com");
    setPassword("password");
    setIsLogin(true);
    setError(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8" id="auth-flow-gateway">
      <div className="w-full max-w-md space-y-8 bg-white border border-slate-200 p-8 rounded-3xl shadow-lg">
        {/* Top brand header */}
        <div className="text-center space-y-2">
          {/* Custom MFP-style brand icon placeholder */}
          <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-tr from-green-400 to-green-600 flex items-center justify-center font-black text-white text-xl font-sans shadow-md">
            f
          </div>
          <h2 className="font-sans font-black text-2xl tracking-tight text-slate-800">
            myfitnesspal <span className="font-light text-slate-500">clone</span>
          </h2>
          <p className="text-xs text-slate-500">
            {isLogin ? "Sign in to track calorie allocations" : "Create account to calculate Mifflin-St Jeor daily BMR"}
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs text-center font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Your Full Name</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Darshan Naik"
                    className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Email Address</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Password</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Key className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Physical Information (Calculates BMR):</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Height (cm)</label>
                    <input
                      type="number"
                      required
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border rounded-lg focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      required
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border rounded-lg focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Birthdate</label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border rounded-lg focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Sex Assigned</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full text-xs p-2 bg-slate-50 border rounded-lg focus:outline-none focus:bg-white"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Physical Activity Modifier</label>
                  <select
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border rounded-lg focus:outline-none focus:bg-white"
                  >
                    <option value="sedentary">Sedentary (No active sports)</option>
                    <option value="light">Lightly Active (1-3 days/week exercise)</option>
                    <option value="moderate font-semibold">Moderately Active (3-5 days/week exercise)</option>
                    <option value="active">Very Active (Heavy sports 6-7 days/week)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-500 hover:bg-green-600 transition-all text-black font-sans font-bold text-sm rounded-full flex items-center justify-center gap-2 shadow-sm"
              id="auth-submit-button"
            >
              {isLogin ? (
                <>
                  <LogIn className="h-4 w-4" />
                  {loading ? "Authenticating session..." : "Log in to MFP"}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  {loading ? "Creating account..." : "Sign up"}
                </>
              )}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-4 text-center mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-semibold text-green-600 hover:text-green-700 block transition-all"
          >
            {isLogin ? "Don't have an account? Sign up now" : "Already registered? Login here"}
          </button>

          {isLogin && (
            <button
              onClick={handleAutoFillDemo}
              className="mx-auto rounded-full bg-green-50 border border-green-100 px-4 py-2 text-[11px] font-bold text-green-700 flex items-center gap-1.5 hover:bg-green-100 transition-all shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              One-click Quick Login Demo Credentials
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

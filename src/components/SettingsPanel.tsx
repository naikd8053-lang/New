import React, { useEffect, useState } from "react";
import safeJson from "../utils/safeJson";
import { User, Activity, Flame, Shield, HelpCircle, Save, CheckCircle2, RotateCcw, Smartphone, BellRing } from "lucide-react";
import { UserProfile } from "../types";

interface SettingsPanelProps {
  token: string;
  onUpdateSuccess: () => void;
}

export default function SettingsPanel({ token, onUpdateSuccess }: SettingsPanelProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState("sedentary");
  
  // Custom Overrides
  const [useCustomGoals, setUseCustomGoals] = useState(false);
  const [customCalories, setCustomCalories] = useState(2000);
  const [customProtein, setCustomProtein] = useState(150);
  const [customCarbs, setCustomCarbs] = useState(220);
  const [customFats, setCustomFats] = useState(55);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Health Mock Integrations
  const [appleConnected, setAppleConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [browserNotifications, setBrowserNotifications] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [token]);

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await fetch("/api/user/profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await safeJson(res) as UserProfile | null;
        if (!data) throw new Error("Empty profile response");
        setProfile(data);
        setName(data.name);
        setDob(data.dob);
        setGender(data.gender);
        setHeight(data.height_cm);
        setWeight(data.weight_kg);
        setActivity(data.activity_level);
        setCustomCalories(data.calorie_goal);
        setCustomProtein(data.protein_goal_g);
        setCustomCarbs(data.carbs_goal_g);
        setCustomFats(data.fat_goal_g);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      const body: any = {
        name,
        dob,
        gender,
        height_cm: height,
        weight_kg: weight,
        activity_level: activity
      };

      if (useCustomGoals) {
        body.custom_calories = customCalories;
        body.custom_protein = customProtein;
        body.custom_carbs = customCarbs;
        body.custom_fats = customFats;
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        throw new Error("Unable to update settings profile");
      }

      setSuccessMsg("Profile and energy budgets updated successfully!");
      onUpdateSuccess();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function triggerPushNotificationRequest() {
    if ("Notification" in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          setBrowserNotifications(true);
          new Notification("MyFitnessPal Reminder Active!", {
            body: "Great job Darshan! Reminders are configured successfully.",
            icon: "/icon.png"
          });
        }
      });
    } else {
      setBrowserNotifications(!browserNotifications);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <span className="inline-block animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-400 mt-2">Loading user configs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="settings-configuration-panel">
      {/* Settings Grid form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Details */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-sans font-bold text-slate-800 text-base flex items-center gap-2 border-b pb-3 mb-5">
            <User className="h-5 w-5 text-green-500" />
            Biological Measurements & Mifflin-St Jeor Formula
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-4 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-4 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Gender Identity</label>
                <div className="flex bg-slate-50 border p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setGender("female")}
                    className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${gender === "female" ? "bg-white text-slate-800 shadow" : "text-slate-400"}`}
                  >
                    Female
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${gender === "male" ? "bg-white text-slate-800 shadow" : "text-slate-400"}`}
                  >
                    Male
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Height (cm)</label>
                <input
                  type="number"
                  required
                  min={100}
                  max={250}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-200 px-4 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-green-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Current Weight (kg)</label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min={30}
                  max={300}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-200 px-4 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-green-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Daily Physical Activity Index</label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 px-4 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-green-500"
              >
                <option value="sedentary">Sedentary (Little or no active exercise)</option>
                <option value="light">Lightly Active (Easy running/walks 1-3 days/week)</option>
                <option value="moderate">Moderately Active (Moderate speed workouts 3-5 days/week)</option>
                <option value="active">Very Active (Heavy sports workouts 6-7 days/week)</option>
                <option value="very_active">Extremely Active (Twice daily physical hard labor drills)</option>
              </select>
            </div>

            {/* Custom calorie togglers & slider offsets */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 block">Override Standard MS-Goal Budgets</span>
                  <span className="text-[10px] text-slate-400 block">Independently dictate custom caloric targets</span>
                </div>
                <input
                  type="checkbox"
                  checked={useCustomGoals}
                  onChange={(e) => setUseCustomGoals(e.target.checked)}
                  className="h-4 w-4 bg-slate-100 accent-green-500 rounded border-slate-300"
                />
              </div>

              {useCustomGoals && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-700 pt-1 border-t">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold block uppercase text-slate-400">Calories (kcal)</span>
                    <input
                      type="number"
                      value={customCalories}
                      onChange={(e) => setCustomCalories(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-xl border font-mono bg-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold block uppercase text-slate-400">Proteins (g)</span>
                    <input
                      type="number"
                      value={customProtein}
                      onChange={(e) => setCustomProtein(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-xl border font-mono bg-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold block uppercase text-slate-400">Carbs (g)</span>
                    <input
                      type="number"
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-xl border font-mono bg-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold block uppercase text-slate-400">Fats (g)</span>
                    <input
                      type="number"
                      value={customFats}
                      onChange={(e) => setCustomFats(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-xl border font-mono bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-xs">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-green-500 hover:bg-green-600 transition-all text-black font-sans font-bold text-sm rounded-full flex items-center justify-center gap-2 shadow-sm"
              id="save-profile-btn"
            >
              <Save className="h-4 w-4" />
              {saving ? "Calculating targets..." : "Save Config Details"}
            </button>
          </form>
        </div>

        {/* Integration Mocks */}
        <div className="space-y-6">
          {/* Apple / Google wearable connects */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-green-500 animate-bounce" />
              Wearable Integrations
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">Directly import active energy metrics and cardiovascular workouts burned from modern companion fitness suites.</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-55/40 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-red-500 ring-4 ring-red-50 text-sm"></span>
                  <div>
                    <span className="font-sans font-bold text-slate-700 text-xs block">Apple Health Suite</span>
                    <span className="text-[10px] text-slate-400 block">{appleConnected ? "Connected" : "Not synchronized"}</span>
                  </div>
                </div>
                <button
                  onClick={() => setAppleConnected(!appleConnected)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${appleConnected ? "bg-red-500 border-red-500 text-white font-semibold" : "bg-white hover:bg-slate-50 text-slate-600 font-medium border-slate-200"}`}
                >
                  {appleConnected ? "Disconnect" : "Connect"}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-55/40 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-yellow-500 ring-4 ring-yellow-50 text-sm">G</span>
                  <div>
                    <span className="font-sans font-bold text-slate-700 text-xs block">Google Fit Suite</span>
                    <span className="text-[10px] text-slate-400 block">{googleConnected ? "Connected" : "Not synchronized"}</span>
                  </div>
                </div>
                <button
                  onClick={() => setGoogleConnected(!googleConnected)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${googleConnected ? "bg-yellow-500 border-yellow-500 text-black font-semibold" : "bg-white hover:bg-slate-50 text-slate-600 font-medium border-slate-200"}`}
                >
                  {googleConnected ? "Disconnect" : "Connect"}
                </button>
              </div>
            </div>
          </div>

          {/* Browser push notifications indicator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2">
              <BellRing className="h-4 w-4 text-green-500" />
              Meal Journal Alerts
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">Turn on non-intrusive reminder alerts to remind you to log your active proteins and daily water volume intake.</p>
            
            <button
              onClick={triggerPushNotificationRequest}
              className={`w-full py-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${browserNotifications ? "bg-green-100 border-green-200 text-green-700" : "bg-white hover:bg-slate-50 text-slate-700"}`}
            >
              {browserNotifications ? "Reminders Enabled ✓" : "Configure Reminders"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

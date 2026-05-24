import React, { useEffect, useState, useCallback } from "react";
import { 
  Home, 
  BookOpen, 
  ChefHat, 
  TrendingUp, 
  User, 
  LogOut, 
  Calendar, 
  Flame, 
  CheckCircle, 
  Sparkles, 
  ArrowRight, 
  Dumbbell, 
  Droplets,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { DiaryData, UserProfile } from "./types";
import { CalorieProgressRing, MacrosSection, WaterTracker, ExerciseCard } from "./components/DashboardUIComponents";
import MealDiarySection from "./components/MealDiarySection";
import RecipeImporter from "./components/RecipeImporter";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import SettingsPanel from "./components/SettingsPanel";
import AuthModal from "./components/AuthModal";

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("mfp_token"));
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(() => {
    const saved = localStorage.getItem("mfp_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<"home" | "diary" | "recipes" | "progress" | "profile">("home");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [diary, setDiary] = useState<DiaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);

  // Auto-Login helper if user is not set (seeds Darshan demo session instantly!)
  useEffect(() => {
    if (!token) {
      handleDemoLogin();
    }
  }, [token]);

  async function handleDemoLogin() {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@myfitnesspal.com",
          password: "password"
        })
      });
      if (res.ok) {
        const data = await res.json();
        handleAuthSuccess(data.token, data.user);
      }
    } catch (err) {
      console.warn("Demo auto-login fallback failed:", err);
    }
  }

  const fetchDiary = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/user/diary?date=${selectedDate}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDiary(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, selectedDate]);

  useEffect(() => {
    fetchDiary();
  }, [fetchDiary]);

  function handleAuthSuccess(newToken: string, newUser: { id: string; email: string; name: string }) {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("mfp_token", newToken);
    localStorage.setItem("mfp_user", JSON.stringify(newUser));
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setDiary(null);
    localStorage.removeItem("mfp_token");
    localStorage.removeItem("mfp_user");
  }

  // Adjust Date back/forth
  function adjustDateByDays(days: number) {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  }

  function formatDisplayDate(dateStr: string) {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";

    try {
      const parts = dateStr.split("-");
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    } catch (e) {
      return dateStr;
    }
  }

  // Complete Diary success modal
  function handleCompleteDiary() {
    setCompleting(true);
    setTimeout(() => {
      setCompleting(false);
      setShowTrophy(true);
    }, 1200);
  }

  if (!token || !user) {
    return <AuthModal onAuthSuccess={handleAuthSuccess} />;
  }

  // Calculate Aggregations for Selected Date
  const consumedCalories = diary?.foods?.reduce((acc, curr) => acc + curr.calories, 0) || 0;
  const burnedCalories = diary?.exercises?.reduce((acc, curr) => acc + curr.calories_burned, 0) || 0;
  const targetCalories = diary?.goals?.calorie_goal || 2000;
  const remainingCalories = targetCalories - consumedCalories + burnedCalories;

  const currentWeight = diary?.goals?.weight_kg || 70;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 flex" id="application-layout-context">
      
      {/* 1. DESKTOP PERMANENT LEFT SIDEBAR NAV */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-6 space-y-8 shrink-0">
        <div className="space-y-1">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-emerald-100">
            f
          </div>
          <h1 className="font-display font-black text-slate-800 text-lg tracking-tight pt-2">
            myfitnesspal <span className="font-light text-slate-400">clone</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Production Suite &bull; v2025</p>
        </div>

        {/* Navigation Tab Links */}
        <nav className="space-y-1 flex-1">
          <button
            onClick={() => setActiveTab("home")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${activeTab === "home" ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/10" : "bg-transparent border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <Home className="h-4.5 w-4.5" />
            Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab("diary")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${activeTab === "diary" ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/10" : "bg-transparent border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            id="tab-meallogs"
          >
            <BookOpen className="h-4.5 w-4.5" />
            Food Diary
          </button>

          <button
            onClick={() => setActiveTab("recipes")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${activeTab === "recipes" ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/10" : "bg-transparent border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <ChefHat className="h-4.5 w-4.5" />
            Recipe Importer
          </button>

          <button
            onClick={() => setActiveTab("progress")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${activeTab === "progress" ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/10" : "bg-transparent border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <TrendingUp className="h-4.5 w-4.5" />
            Progress Charts
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${activeTab === "profile" ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/10" : "bg-transparent border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <User className="h-4.5 w-4.5" />
            BMR Profile Target
          </button>
        </nav>

        {/* Bottom User status controls */}
        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
          <div className="px-4 py-2 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Identifier</span>
            <span className="text-xs font-semibold text-slate-800 truncate block max-w-[150px]">{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-slate-500 hover:text-red-500 text-[11px] font-bold py-2 px-4 rounded-xl hover:bg-red-55 transition-all flex items-center gap-2 text-left"
          >
            <LogOut className="h-4 w-4" />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* 2. MAIN CENTER WORKING PORT */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto pb-24 lg:pb-8">
        
        {/* Global Toolbar Header */}
        <header className="sticky top-0 bg-white/85 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center lg:hidden">
              f
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wide">Daily Tracking</span>
              <h1 className="font-sans font-black text-slate-800 text-base md:text-lg">Good morning, {user.name.split(" ")[0]}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Animated 7-day streak fire emoji */}
            <motion.div
              animate={{ 
                rotate: [0, -10, 8, -8, 8, 0],
                scale: [1, 1.05, 1, 1.05, 1]
              }}
              transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 4, ease: "easeInOut" }}
              className="bg-orange-50 border border-orange-100/50 rounded-full py-1.5 px-3 flex items-center gap-1.5 cursor-pointer hover:bg-orange-100/40 select-none shadow-sm"
              title="7 Days Streak! Click to wisp fire"
            >
              <Flame className="h-4.5 w-4.5 text-orange-500 fill-orange-500" />
              <span className="text-[11px] font-bold text-orange-700">7 Day Streak!</span>
            </motion.div>

            {/* Date-Shifter selectors */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-1.5 py-0.5">
              <button 
                onClick={() => adjustDateByDays(-1)}
                className="p-1 hover:bg-white rounded-full transition-colors font-bold text-slate-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[11px] font-bold font-mono px-2 text-slate-700 select-none text-center min-w-[70px]">
                {formatDisplayDate(selectedDate)}
              </span>
              <button 
                onClick={() => adjustDateByDays(1)}
                className="p-1 hover:bg-white rounded-full transition-colors font-bold text-slate-600"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Core Tab panel container */}
        <div className="px-4 md:px-8 py-6 flex-1 max-w-5xl w-full mx-auto" id="main-view-container">
          
          <AnimatePresence mode="wait">
            {activeTab === "home" && (
              <motion.div
                key="home-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Calories Budget top layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  <div className="lg:col-span-2">
                    <CalorieProgressRing 
                      consumed={consumedCalories} 
                      target={targetCalories} 
                      burned={burnedCalories} 
                    />
                  </div>
                  <div>
                    <MacrosSection 
                      foodLogs={diary?.foods || []} 
                      targetProtein={diary?.goals?.protein_goal_g || 150} 
                      targetCarbs={diary?.goals?.carbs_goal_g || 225} 
                      targetFat={diary?.goals?.fat_goal_g || 55} 
                    />
                  </div>
                </div>

                {/* Sub components row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WaterTracker 
                    amountMl={diary?.water?.amount_ml || 0} 
                    token={token} 
                    onUpdate={() => fetchDiary()} 
                  />
                  <ExerciseCard 
                    exercises={diary?.exercises || []} 
                    token={token} 
                    onUpdate={() => fetchDiary()} 
                  />
                </div>

                {/* Daily Status adjustment card */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="space-y-1 block text-center md:text-left">
                    <h3 className="font-sans font-extrabold text-sm text-emerald-950 block">Complete Daily Caloric Journal</h3>
                    <p className="text-xs text-slate-500">Lock your nutrients logs on this date to freeze streak history. We will publish final stats to the analytics board.</p>
                  </div>
                  <button
                    onClick={handleCompleteDiary}
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-extrabold text-xs rounded-full py-3 px-6 shadow-sm hover:shadow active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
                    id="complete-diary-btn"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Complete Diary & lock
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === "diary" && (
              <motion.div
                key="diary-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MealDiarySection 
                  foods={diary?.foods || []} 
                  token={token} 
                  onUpdate={() => fetchDiary()} 
                />
              </motion.div>
            )}

            {activeTab === "recipes" && (
              <motion.div
                key="recipes-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RecipeImporter token={token} onLoggedSuccess={() => fetchDiary()} />
              </motion.div>
            )}

            {activeTab === "progress" && (
              <motion.div
                key="progress-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AnalyticsDashboard token={token} />
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div
                key="profile-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SettingsPanel token={token} onUpdateSuccess={() => fetchDiary()} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 3. DESKTOP RIGHT SUGGESTION RAIL PANEL */}
      <aside className="hidden xl:flex flex-col w-80 bg-white border-l border-slate-200 p-6 space-y-6 shrink-0 max-h-screen overflow-y-auto">
        <div className="space-y-1">
          <span className="text-[10px] text-green-600 font-extrabold uppercase tracking-widest block">Intelligent Coach</span>
          <h3 className="font-sans font-bold text-slate-800 text-sm">Dynamic Nutrition Board</h3>
        </div>

        {/* Biological weight cards */}
        <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Weight Milestone Tracker</span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-slate-800">{currentWeight}</span>
            <span className="text-xs font-semibold text-slate-500">kg total</span>
          </div>
          <span className="text-[10px] text-slate-400 leading-relaxed block">Current mass was retrieved from biological measurement sheets. Select profile settings to adapt goals.</span>
        </div>

        {/* Custom tips guides */}
        <div className="space-y-3 pt-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Recommended Tips:</span>
          
          <div className="p-3 bg-red-50/50 border border-red-100/50 rounded-xl space-y-1.5 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-600 leading-relaxed font-sans">
              <strong>Protein allocation:</strong> High-protein items help stabilize muscle density. Current targets specify <strong>{diary?.goals?.protein_goal_g || 150}g</strong> daily.
            </p>
          </div>

          <div className="p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl space-y-1.5 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-600 leading-relaxed font-sans">
              <strong>Keep hydrated:</strong> Double-tap on the H2O water widget to instantly file <strong>250ml</strong> of pure liquid volume!
            </p>
          </div>

          <div className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl space-y-1.5 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-600 leading-relaxed font-sans">
              <strong>Active workout:</strong> Log daily exercises inside active logs. MFP adjusts your remaining caloric budgets automatically.
            </p>
          </div>
        </div>

        {/* Gemini highlights widget */}
        <div className="p-4 bg-gradient-to-tr from-violet-500/10 to-indigo-500/5 border border-violet-100 rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 bg-violet-100/50 inline-block px-2 py-0.5 rounded-full text-violet-700 text-[9px] font-bold uppercase tracking-wide max-w-max">
            <Sparkles className="h-3 w-3 fill-violet-700 animate-pulse" />
            AI Parser
          </div>
          <h4 className="font-sans font-bold text-slate-800 text-xs">Recipe Smart Importer</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed leading-medium">Have online recipes or copying meal links? Let Gemini translate weights, items, and macro balances per serving in one click!</p>
          <button
            onClick={() => setActiveTab("recipes")}
            className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            Launch Importer <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* 4. MOBILE / PORTRAIT BOTTOM FIXED NAV BAR */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex py-1.5 px-3 select-none justify-around items-center lg:hidden z-30 shadow-lg">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-0.5 min-w-[50px] ${activeTab === "home" ? "text-emerald-600" : "text-slate-400"}`}
        >
          <Home className="h-4.5 w-4.5" />
          <span className="text-[9px] font-bold">Home</span>
        </button>

        <button
          onClick={() => setActiveTab("diary")}
          className={`flex flex-col items-center gap-0.5 min-w-[50px] ${activeTab === "diary" ? "text-emerald-600" : "text-slate-400"}`}
        >
          <BookOpen className="h-4.5 w-4.5" />
          <span className="text-[9px] font-bold">Diary</span>
        </button>

        <button
          onClick={() => setActiveTab("recipes")}
          className={`flex flex-col items-center gap-0.5 min-w-[50px] ${activeTab === "recipes" ? "text-emerald-600" : "text-slate-400"}`}
        >
          <ChefHat className="h-4.5 w-4.5" />
          <span className="text-[9px] font-bold">Importer</span>
        </button>

        <button
          onClick={() => setActiveTab("progress")}
          className={`flex flex-col items-center gap-0.5 min-w-[50px] ${activeTab === "progress" ? "text-emerald-600" : "text-slate-400"}`}
        >
          <TrendingUp className="h-4.5 w-4.5" />
          <span className="text-[9px] font-bold">Charts</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-0.5 min-w-[50px] ${activeTab === "profile" ? "text-emerald-600" : "text-slate-400"}`}
        >
          <User className="h-4.5 w-4.5" />
          <span className="text-[9px] font-bold">Goals</span>
        </button>
      </nav>

      {/* Diary complete modal overlays */}
      <AnimatePresence>
        {completing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
          >
            <div className="text-center space-y-4">
              <span className="inline-block animate-spin rounded-full border-4 border-green-500 border-t-transparent h-12 w-12" />
              <p className="text-white font-bold text-base">Archiving dynamic calorie limits ...</p>
            </div>
          </motion.div>
        )}

        {showTrophy && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <div className="bg-white border text-center rounded-3xl p-8 max-w-sm w-full space-y-5 shadow-2xl">
              <div className="mx-auto h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500 animate-bounce">
                <Trophy className="h-10 w-10 fill-yellow-500" />
              </div>
              <div className="space-y-1">
                <h3 className="font-sans font-black text-slate-800 text-lg">Great job, {user.name}!</h3>
                <p className="text-xs text-slate-400">Your calorie allocations are saved successfully! Let's hit another daily streak targets tomorrow.</p>
              </div>

              {/* Aggregated readout info */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150 grid grid-cols-2 text-center text-slate-700 font-sans font-medium">
                <div className="border-r">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Net Calories</span>
                  <span className="font-mono text-sm font-black text-green-600">{consumedCalories - burnedCalories} kcal</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Goals Deficit</span>
                  <span className="font-mono text-sm font-black text-slate-800">{remainingCalories} left</span>
                </div>
              </div>

              <button
                onClick={() => setShowTrophy(false)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-sans font-bold text-xs shadow-md shadow-emerald-700/10 transition-all text-center cursor-pointer"
              >
                Close Journal Results
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

import React, { useState } from "react";
import { Plus, Flame, Sparkles, Trophy, Dumbbell, Droplets, Volume2, PlusCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FoodLog, ExerciseLog, WaterLog } from "../types";

// --- CIRCULAR CALORIE PROGRESS RING ---
interface CalorieProgressRingProps {
  consumed: number;
  target: number;
  burned: number;
}

export function CalorieProgressRing({ consumed, target, burned }: CalorieProgressRingProps) {
  const remaining = target - consumed + burned;
  const isOver = remaining < 0;

  // Percentage calculations
  const capTarget = target + burned || 2000;
  const percentage = Math.min(100, Math.max(0, (consumed / capTarget) * 100));

  // Circle properties
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-3xl shadow-sm" id="calorie-ring-section">
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* SVG Circle track */}
        <svg className="h-full w-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="12"
          />
          <motion.circle
            cx="96"
            cy="96"
            r={radius}
            fill="none"
            stroke={isOver ? "#EF4444" : "#10B981"}
            strokeWidth="12"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Inner Metrics readout */}
        <div className="absolute text-center flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining</span>
          <motion.span
            key={remaining}
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`font-mono text-3xl font-black ${isOver ? "text-red-500" : remaining < 200 ? "text-orange-500" : "text-slate-800"}`}
          >
            {Math.abs(remaining)}
          </motion.span>
          <span className="text-[10px] font-semibold text-slate-500">
            {isOver ? "kcal over" : "kcal left"}
          </span>
        </div>
      </div>

      {/* Metrics breakdown row */}
      <div className="grid grid-cols-3 gap-6 w-full text-center mt-4 pt-4 border-t border-slate-100">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Goal</span>
          <span className="font-mono text-sm font-bold text-slate-700">{target}</span>
        </div>
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Food</span>
          <span className="font-mono text-sm font-bold text-slate-700">{consumed}</span>
        </div>
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Exercise</span>
          <span className="font-mono text-sm font-bold text-green-500 flex items-center justify-center gap-0.5">
            +{burned}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- MACROS SUMMARY SECTION ---
interface MacrosSectionProps {
  foodLogs: FoodLog[];
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

export function MacrosSection({ foodLogs, targetProtein, targetCarbs, targetFat }: MacrosSectionProps) {
  // Aggregate logged grams
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  foodLogs.forEach(f => {
    protein += f.protein_g * f.quantity;
    carbs += f.carbs_g * f.quantity;
    fat += f.fat_g * f.quantity;
  });

  protein = Math.round(protein);
  carbs = Math.round(carbs);
  fat = Math.round(fat);

  const totalGrams = protein + carbs + fat || 1;
  const pPct = Math.round((protein / totalGrams) * 100);
  const cPct = Math.round((carbs / totalGrams) * 100);
  const fPct = Math.round((fat / totalGrams) * 100);

  // Mifflin comparison calculations
  const pProg = Math.min(100, (protein / (targetProtein || 150)) * 100);
  const cProg = Math.min(100, (carbs / (targetCarbs || 225)) * 100);
  const fProg = Math.min(100, (fat / (targetFat || 55)) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4" id="macros-summary-section">
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className="font-sans font-bold text-slate-800 text-sm">Macronutrient Distribution</h4>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">My Targets</span>
      </div>

      <div className="space-y-4">
        {/* Carbohydrates (Blue) */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-sans font-bold text-slate-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500 block" /> Carbs
            </span>
            <span className="font-mono text-slate-500 font-medium">
              <span className="font-bold text-slate-800">{carbs}g</span> / {targetCarbs}g ({cPct}%)
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${cProg}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-[#3B82F6] rounded-full"
            />
          </div>
        </div>

        {/* Protein (Red) */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-sans font-bold text-slate-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 block" /> Protein
            </span>
            <span className="font-mono text-slate-500 font-medium">
              <span className="font-bold text-slate-800">{protein}g</span> / {targetProtein}g ({pPct}%)
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pProg}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-[#EF4444] rounded-full"
            />
          </div>
        </div>

        {/* Fats (Amber) */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-sans font-bold text-slate-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 block" /> Fats
            </span>
            <span className="font-mono text-slate-500 font-medium">
              <span className="font-bold text-slate-800">{fat}g</span> / {targetFat}g ({fPct}%)
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fProg}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-[#F59E0B] rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- WATER LOGICAL TRACKER ---
interface WaterTrackerProps {
  amountMl: number;
  token: string;
  onUpdate: (newAmount: number) => void;
}

export function WaterTracker({ amountMl, token, onUpdate }: WaterTrackerProps) {
  const [adding, setAdding] = useState(false);
  const targetMl = 2500;
  const progress = Math.min(100, (amountMl / targetMl) * 100);

  async function adjustWater(addAmount: number) {
    setAdding(true);
    const updated = Math.max(0, amountMl + addAmount);
    try {
      const resp = await fetch("/api/user/water", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ amount_ml: updated })
      });
      if (resp.ok) {
        onUpdate(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div
      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 select-none cursor-pointer active:scale-[0.99] transition-transform"
      onDoubleClick={() => adjustWater(250)}
      title="Double-click to add 250ml instantly!"
      id="water-tracker-block"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            <Droplets className="h-5 w-5 fill-blue-500" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-sm">H2O Water Hydration</h4>
            <p className="text-[10px] text-slate-400 font-medium">Target: 2.5 Liters &bull; Double-tap adds 250ml</p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-slate-800 font-bold text-sm block">{amountMl} ml</span>
          <span className="text-[9px] text-slate-400 font-bold block uppercase">{Math.round(progress)}% reached</span>
        </div>
      </div>

      {/* Progress horizontal line */}
      <div className="h-3 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
        />
      </div>

      {/* Control triggers */}
      <div className="flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); adjustWater(-250); }}
          disabled={adding || amountMl <= 0}
          className="flex-1 py-1.5 border border-slate-200 rounded-xl text-center font-sans font-bold text-[10px] uppercase text-slate-500 hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-45"
        >
          - 250ml
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); adjustWater(250); }}
          disabled={adding}
          className="flex-1 py-1.5 bg-blue-500 text-white rounded-xl text-center font-sans font-bold text-[10px] uppercase hover:bg-blue-600 active:bg-blue-700 transition-colors"
        >
          + 250ml
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); adjustWater(500); }}
          disabled={adding}
          className="flex-1 py-1.5 bg-blue-600 text-white rounded-xl text-center font-sans font-bold text-[10px] uppercase hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          + 500ml (Bottle)
        </button>
      </div>
    </div>
  );
}

// --- EXERCISE ACTIVITY LOGGER ---
interface ExerciseCardProps {
  exercises: ExerciseLog[];
  token: string;
  onUpdate: () => void;
}

export function ExerciseCard({ exercises, token, onUpdate }: ExerciseCardProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [burned, setBurned] = useState("250");
  const [saving, setSaving] = useState(false);

  // Total active burned calories
  const activeCalories = exercises.reduce((acc, curr) => acc + curr.calories_burned, 0);

  // Fast select items
  const quickExercises = [
    { name: "Jogging (Moderate pace)", duration: 30, cals: 280 },
    { name: "Cycling (Cardio)", duration: 45, cals: 350 },
    { name: "Weight Lifting (Strength)", duration: 60, cals: 220 },
    { name: "Swimming", duration: 30, cals: 310 }
  ];

  async function handleLogCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !duration || !burned) return;
    setSaving(true);

    try {
      const res = await fetch("/api/exercise/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          activity_name: name,
          duration_minutes: Number(duration),
          calories_burned: Number(burned),
          logged_at: new Date().toISOString().split("T")[0]
        })
      });

      if (res.ok) {
        onUpdate();
        setName("");
        setShowAdd(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickAdd(q: typeof quickExercises[0]) {
    setSaving(true);
    try {
      const res = await fetch("/api/exercise/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          activity_name: q.name,
          duration_minutes: q.duration,
          calories_burned: q.cals,
          logged_at: new Date().toISOString().split("T")[0]
        })
      });

      if (res.ok) {
        onUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(exerciseId: string) {
    try {
      const res = await fetch(`/api/exercise/log/${exerciseId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4" id="exercise-card-container">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-sm">Active Cardiovascular Exercises</h4>
            <p className="text-[10px] text-slate-400 font-medium">Logged burned: {activeCalories} kcal today</p>
          </div>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-full bg-slate-100 hover:bg-slate-200 font-sans font-semibold text-xs py-1 px-3 text-slate-700 transition-colors flex items-center gap-1"
          id="toggle-log-exercise"
        >
          {showAdd ? "Close" : "+ Log Workout"}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t pt-4 border-slate-100 space-y-3"
          >
            {/* Quick selectors lists */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Quick Cardios:</span>
              <div className="flex flex-wrap gap-1.5">
                {quickExercises.map((qe, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAdd(qe)}
                    disabled={saving}
                    className="p-1 px-2 text-[10px] text-slate-600 border rounded-lg hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left truncate max-w-[200px]"
                  >
                     {qe.name} &bull; <span className="font-bold text-emerald-600">-{qe.cals}kcal</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom inputs forms */}
            <form onSubmit={handleLogCustom} className="space-y-2 pt-2 border-t">
              <span className="text-[10px] font-mono text-slate-400 block mb-1 font-semibold uppercase">Custom Workout Details:</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Workout description (e.g. HIIT)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs rounded-lg border px-3 py-1.5 focus:outline-none"
                />
                <input
                  type="number"
                  required
                  placeholder="Mins (e.g. 30)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full text-xs rounded-lg border px-3 py-1.5 focus:outline-none"
                />
                <input
                  type="number"
                  required
                  placeholder="Kcal burned"
                  value={burned}
                  onChange={(e) => setBurned(e.target.value)}
                  className="w-full text-xs rounded-lg border px-3 py-1.5 focus:outline-none text-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !name}
                className="w-full py-2 bg-emerald-500 text-black font-sans font-bold text-xs rounded-xl shadow-sm hover:bg-emerald-600 active:bg-emerald-750 transition-colors"
              >
                {saving ? "Logging activities..." : "Log Cardio"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logged Item list */}
      <div className="space-y-1">
        {exercises.length === 0 ? (
          <div className="text-center py-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-xs text-slate-400">Add an exercise today to adjust remaining calories!</p>
          </div>
        ) : (
          exercises.map((e) => (
            <div key={e.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <div>
                <span className="font-sans font-bold text-slate-700 text-xs block">{e.activity_name}</span>
                <span className="text-[10px] text-slate-400 block">{e.duration_minutes} minutes duration</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-emerald-600 font-bold text-xs">-{e.calories_burned} kcal</span>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-slate-400 hover:text-red-500 rounded p-1"
                  title="Remove workout log"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

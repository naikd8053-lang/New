import React, { useEffect, useState } from "react";
import { TrendingUp, Award, BarChart3, Calendar, FileDown, ArrowDownLeft, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { WeeklySummaryDay, WeightEntry } from "../types";

interface AnalyticsDashboardProps {
  token: string;
}

export default function AnalyticsDashboard({ token }: AnalyticsDashboardProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklySummaryDay[]>([]);
  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBar, setActiveBar] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      
      const [weeklyRes, weightRes] = await Promise.all([
        fetch("/api/reports/weekly-summary", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/progress/weight", { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (!weeklyRes.ok || !weightRes.ok) {
        throw new Error("Unable to read historical wellness analytics");
      }

      const weekJson = await weeklyRes.json();
      const weightJson = await weightRes.json();

      setWeeklyData(weekJson);
      setWeightData(weightJson);
    } catch (err: any) {
      setError(err.message || "Failed to parse dashboard summaries");
    } finally {
      setLoading(false);
    }
  }

  // Calculate Macro Averages for past week
  function compileWeeklyMacroAvg() {
    if (!weeklyData || weeklyData.length === 0) return { carbs: 0, protein: 0, fat: 0 };
    let totalC = 0, totalP = 0, totalF = 0;
    weeklyData.forEach(day => {
      totalC += day.macros.carbs;
      totalP += day.macros.protein;
      totalF += day.macros.fat;
    });

    const len = weeklyData.length;
    return {
      carbs: Math.round(totalC / len),
      protein: Math.round(totalP / len),
      fat: Math.round(totalF / len)
    };
  }

  const avgMacros = compileWeeklyMacroAvg();
  const totalGrams = avgMacros.carbs + avgMacros.protein + avgMacros.fat || 1;
  const carbPct = Math.round((avgMacros.carbs / totalGrams) * 100);
  const protPct = Math.round((avgMacros.protein / totalGrams) * 100);
  const fatPct = Math.round((avgMacros.fat / totalGrams) * 100);

  // CSV Exporter
  function handleExportCSV() {
    if (!weeklyData.length) return;
    
    // Header
    const csvContent = [
      ["Date", "Calorie Target (kcal)", "Calories Consumed (kcal)", "Calories Burned (kcal)", "Net (kcal)", "Carbs (g)", "Protein (g)", "Fat (g)"].join(","),
      ...weeklyData.map(day => [
        day.date,
        day.target,
        day.consumed,
        day.burned,
        day.net,
        day.macros.carbs,
        day.macros.protein,
        day.macros.fat
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MyFitnessPal_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Formatter for dates
  function formatLabelDate(dateStr: string) {
    try {
      const parts = dateStr.split("-");
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
    } catch (e) {
      return dateStr;
    }
  }

  // Pure SVG Line Graph Helper Functions
  const renderWeightLineChart = () => {
    if (!weightData || weightData.length === 0) {
      return (
        <div className="h-44 bg-slate-50 rounded-2xl flex items-center justify-center border border-dashed border-slate-200">
          <p className="text-xs text-slate-400">Log some weights over multiple days to show progress.</p>
        </div>
      );
    }

    const width = 500;
    const height = 180;
    const padding = 25;

    const weights = weightData.map(w => w.weight_kg);
    const maxWeight = Math.max(...weights) + 1.5;
    const minWeight = Math.max(0, Math.min(...weights) - 1.5);
    const weightRange = maxWeight - minWeight || 1;

    const getX = (index: number) => {
      if (weightData.length <= 1) return width / 2;
      return padding + (index / (weightData.length - 1)) * (width - padding * 2);
    };

    const getY = (weight: number) => {
      const proportion = (weight - minWeight) / weightRange;
      return height - padding - proportion * (height - padding * 2);
    };

    let pathD = "";
    weightData.forEach((d, idx) => {
      const x = getX(idx);
      const y = getY(d.weight_kg);
      if (idx === 0) {
        pathD = `M ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
      }
    });

    return (
      <div className="relative w-full overflow-x-auto pr-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Grid lines */}
          <line x1={padding} y1={getY(minWeight)} x2={width - padding} y2={getY(minWeight)} stroke="#E2E8F0" strokeWidth="0.5" />
          <line x1={padding} y1={getY((minWeight + maxWeight) / 2)} x2={width - padding} y2={getY((minWeight + maxWeight) / 2)} stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="3,3" />
          <line x1={padding} y1={getY(maxWeight)} x2={width - padding} y2={getY(maxWeight)} stroke="#E2E8F0" strokeWidth="0.5" />

          {/* Connected Curved Poly */}
          {weightData.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots */}
          {weightData.map((d, index) => {
            const x = getX(index);
            const y = getY(d.weight_kg);
            return (
              <g key={d.id} className="group cursor-pointer">
                <circle cx={x} cy={y} r="5" fill="#059669" className="hover:r-7 transition-all duration-150" />
                <circle cx={x} cy={y} r="2" fill="#FFFFFF" />
                {/* Embedded dynamic text values */}
                <text x={x} y={y - 10} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1E293B" className="font-mono">
                  {d.weight_kg}kg
                </text>
                {/* Horizontal label */}
                <text x={x} y={height - 5} textAnchor="middle" fontSize="6.5" fill="#64748B">
                  {formatLabelDate(d.logged_at)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // SVGs Bar Chart Helper for calorie target comparison
  const renderCalorieBarChart = () => {
    if (!weeklyData || weeklyData.length === 0) {
      return (
        <div className="h-44 bg-slate-50 rounded-2xl flex items-center justify-center">
          <p className="text-xs text-slate-400">Log some food and meals to show calorie metrics.</p>
        </div>
      );
    }

    const width = 500;
    const height = 180;
    const padding = 25;
    const maxVal = Math.max(...weeklyData.map(d => Math.max(d.target, d.consumed, d.net)), 2000);

    const getX = (index: number) => {
      const colWidth = (width - padding * 2) / weeklyData.length;
      return padding + index * colWidth + colWidth / 4;
    };

    const getY = (val: number) => {
      const ratio = val / maxVal;
      return height - padding - ratio * (height - padding * 2);
    };

    const colWidth = ((width - padding * 2) / weeklyData.length) * 0.5;

    return (
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Target Reference Line */}
          {weeklyData.length > 0 && (
            <line
              x1={padding}
              y1={getY(weeklyData[0].target)}
              x2={width - padding}
              y2={getY(weeklyData[0].target)}
              stroke="#EF4444"
              strokeWidth="0.8"
              strokeDasharray="4,4"
            />
          )}

          {weeklyData.map((day, idx) => {
            const x = getX(idx);
            const yTarget = getY(day.target);
            const yConsumed = getY(day.consumed);
            const barHeight = Math.max(2, height - padding - yConsumed);
            const isOverBudget = day.consumed > day.target;

            return (
              <g
                key={day.date}
                className="cursor-pointer"
                onMouseEnter={() => setActiveBar(idx)}
                onMouseLeave={() => setActiveBar(null)}
              >
                {/* Background column highlights */}
                {activeBar === idx && (
                  <rect
                    x={x - colWidth * 0.25}
                    y={5}
                    width={colWidth * 1.5}
                    height={height - padding - 5}
                    fill="#F1F5F9"
                    rx="6"
                  />
                )}

                {/* Actual consumed column */}
                <rect
                  x={x}
                  y={yConsumed}
                  width={colWidth}
                  height={barHeight}
                  fill={isOverBudget ? "#EF4444" : "#10B981"}
                  rx="4"
                  className="transition-all duration-200"
                />

                {/* Floating tooltip inline text */}
                <text x={x + colWidth / 2} y={yConsumed - 6} textAnchor="middle" fontSize="7.5" fontWeight="black" fill="#1E293B" className="font-mono">
                  {day.consumed}
                </text>

                {/* Day label */}
                <text x={x + colWidth / 2} y={height - 5} textAnchor="middle" fontSize="7" fontWeight="medium" fill="#64748B">
                  {formatLabelDate(day.date)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center h-80">
        <span className="inline-block animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-400 mt-2">Cooking analytics records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-sm font-semibold text-slate-800">Analytics Error</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="analytics-module-dashboard">
      {/* Top Banner stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50/50 border border-emerald-100 flex items-center justify-between shadow-sm">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Weekly Calorie Deficit</span>
            <span className="text-xl font-bold font-mono text-emerald-800">
              {weeklyData.reduce((acc, curr) => acc + (curr.target - curr.consumed), 0)} kcal
            </span>
            <span className="text-[10px] block text-emerald-600 font-semibold font-sans">Under total targets</span>
          </div>
          <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600 shrink-0">
            <Award className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-50/30 border border-blue-100 flex items-center justify-between shadow-sm">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Calculated Macro Balance</span>
            <span className="text-sm font-bold text-slate-700">
              {carbPct}% C / {protPct}% P / {fatPct}% F
            </span>
            <span className="text-[10px] block text-blue-600 font-semibold font-sans">7-day running average</span>
          </div>
          <div className="rounded-full bg-blue-500/10 p-2 text-blue-600 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-teal-50/30 border border-teal-100 flex items-center justify-between shadow-sm">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Active Exercise Sessions</span>
            <span className="text-xl font-bold font-mono text-teal-800">
              {weeklyData.filter(d => d.burned > 0).length} Session(s)
            </span>
            <span className="text-[10px] block text-teal-600 font-semibold font-sans">Logged active workouts</span>
          </div>
          <div className="rounded-full bg-teal-500/10 p-2 text-teal-600 shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calorie trends map */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-sans font-bold text-slate-800 text-sm">Calorie Balance</h3>
              <p className="text-xs text-slate-400">Total daily actual consumed (bars) vs target goal (red dotted line)</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-1 font-semibold text-slate-700 transition-colors"
              id="export-csv-summary"
            >
              <FileDown className="h-3.5 w-3.5" /> CSV Report
            </button>
          </div>
          <div className="p-1.5 border border-slate-100 bg-slate-50/30 rounded-xl">
            {renderCalorieBarChart()}
          </div>
          <div className="flex justify-center gap-4 text-[10px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 bg-green-500 rounded block" /> Under Target Goal</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 bg-red-500 rounded block" /> Over Target Budget</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 border border-red-500 border-dashed rounded block" /> Standard Limit Line</span>
          </div>
        </div>

        {/* Weight logs line projection */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-sans font-bold text-slate-800 text-sm">Weight Progression Curve</h3>
            <p className="text-xs text-slate-400">Historical logs showing variations and trends</p>
          </div>
          <div className="p-1.5 border border-slate-100 bg-slate-50/30 rounded-xl">
            {renderWeightLineChart()}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 px-2 pt-1 font-medium">
            <span>Scale Unit: kg</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">● Current Target Weight reached</span>
          </div>
        </div>
      </div>

      {/* Donut Macro stats card */}
      <div className="bg-white border rounded-2xl p-5 shadow-sm">
        <h3 className="font-sans font-bold text-slate-800 text-sm block mb-3">Weekly Average Macro Share</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Donut graphic chart */}
          <div className="flex justify-center">
            <div className="relative h-40 w-40 flex items-center justify-center">
              {/* Custom SVG Donut */}
              <svg viewBox="0 0 36 36" className="h-full w-full transform -rotate-90">
                {/* Background tracks */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                
                {/* Fats Seg */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3.2"
                  strokeDasharray={`${fatPct} ${100 - fatPct}`}
                  strokeDashoffset={0}
                />
                {/* Carbs Seg */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3.2"
                  strokeDasharray={`${carbPct} ${100 - carbPct}`}
                  strokeDashoffset={-fatPct}
                />
                {/* Protein Seg */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="3.2"
                  strokeDasharray={`${protPct} ${100 - protPct}`}
                  strokeDashoffset={-(fatPct + carbPct)}
                />
              </svg>
              <div className="absolute text-center bg-white rounded-full p-2 w-28 h-28 flex flex-col justify-center shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Averages</span>
                <span className="text-xl font-bold font-mono text-slate-800">{totalGrams}g</span>
                <span className="text-[10px] text-slate-400 font-semibold block">macro grams</span>
              </div>
            </div>
          </div>

          {/* Indicators details side */}
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-medium">To maintain lean muscle protein mass and maximize fat reduction, your Mifflin MS goal targets were distributed into this specific weekly macro budget share:</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/50 border border-blue-100/50">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 bg-[#3B82F6] rounded-full block" />
                  <span className="text-xs font-semibold text-slate-700">Carbohydrates</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800 font-mono">{avgMacros.carbs}g</span>
                  <span className="text-[10px] text-slate-400 font-semibold ml-1">({carbPct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/50 border border-red-100/50">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 bg-[#EF4444] rounded-full block" />
                  <span className="text-xs font-semibold text-slate-700">Protein</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800 font-mono">{avgMacros.protein}g</span>
                  <span className="text-[10px] text-slate-400 font-semibold ml-1">({protPct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 border border-amber-100/50">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 bg-[#F59E0B] rounded-full block" />
                  <span className="text-xs font-semibold text-slate-700">Healthy Fats</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800 font-mono">{avgMacros.fat}g</span>
                  <span className="text-[10px] text-slate-400 font-semibold ml-1">({fatPct}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

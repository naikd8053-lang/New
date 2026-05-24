import React, { useState } from "react";
import { Sparkles, ArrowRight, Check, AlertCircle, RefreshCw, ChefHat, LogIn, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AIProcessedRecipe } from "../types";

interface RecipeImporterProps {
  token: string;
  onLoggedSuccess: () => void;
}

export default function RecipeImporter({ token, onLoggedSuccess }: RecipeImporterProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snacks">("lunch");
  const [result, setResult] = useState<AIProcessedRecipe | null>(null);
  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [loggingProgress, setLoggingProgress] = useState(false);
  const [loggedMeal, setLoggedMeal] = useState(false);

  async function handleImport() {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setLoggedMeal(false);

    try {
      const response = await fetch("/api/recipes/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ recipeText: inputText })
      });

      if (!response.ok) {
        throw new Error("Unable to parse recipe. Please inspect connection or API key.");
      }

      const data = await response.json();
      setResult(data);
      setServingsMultiplier(1);
    } catch (err: any) {
      setError(err.message || "Recipe import failed. Please verify your Gemini API Key.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToDiary() {
    if (!result) return;
    setLoggingProgress(true);
    setError(null);

    // Calculate details per adjusted serving
    const singleCal = Math.round(result.calories * servingsMultiplier);
    const singleProtein = Number((result.protein * servingsMultiplier).toFixed(1));
    const singleCarbs = Number((result.carbs * servingsMultiplier).toFixed(1));
    const singleFat = Number((result.fat * servingsMultiplier).toFixed(1));

    try {
      const response = await fetch("/api/food/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          food_name: result.recipeName,
          meal_type: mealType,
          serving_size: `${result.servingSize} (Imported)`,
          quantity: servingsMultiplier,
          calories: singleCal,
          protein_g: singleProtein,
          carbs_g: singleCarbs,
          fat_g: singleFat,
          logged_at: new Date().toISOString().split("T")[0]
        })
      });

      if (!response.ok) {
        throw new Error("Failed to post food log to remote diary.");
      }

      setLoggedMeal(true);
      onLoggedSuccess();
      setTimeout(() => {
        setLoggedMeal(false);
        setResult(null);
        setInputText("");
      }, 2500);

    } catch (err: any) {
      setError(err.message || "Diary injection failed");
    } finally {
      setLoggingProgress(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-6" id="recipe-importer-container">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="font-sans font-bold text-xl text-slate-800 flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-green-500" />
            Gemini Recipe Importer
          </h2>
          <p className="text-xs text-slate-500">Paste any cooking guide, raw text or ingredient outline. MyFitnessPal uses Gemini to extract perfect calorie and nutrient proportions.</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 bg-violet-100 text-violet-700 rounded-full py-1 px-3 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 fill-violet-700 animate-pulse" />
          AI Powered
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="input-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Paste Recipe Details</label>
              <textarea
                rows={6}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste whole internet recipes, descriptions, or list items like:&#10;1 scoop Whey Protein Powder, 1 Banana, 1 cup unsweetened whole Almond Milk, blended with ice..."
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-green-500 transition-all font-sans"
                id="recipe-text-area"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={loading || !inputText.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-sans font-medium text-sm py-3 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                id="import-recipe-button"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analyzing raw contents ...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Import Recipe
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-5"
          >
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-200/60 pb-3">
                <div>
                  <h3 className="font-sans font-bold text-slate-800 text-base">{result.recipeName}</h3>
                  <p className="text-xs text-slate-500">Estimated serving: {result.servingSize} &bull; Total recipe yield: {result.servings} serving(s)</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-2xl font-black text-green-600 block">{Math.round(result.calories * servingsMultiplier)}</span>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total cals</span>
                </div>
              </div>

              {/* Nutrition row */}
              <div className="grid grid-cols-3 gap-3 text-center py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Carbs</span>
                  <span className="text-sm font-semibold text-blue-500">{(result.carbs * servingsMultiplier).toFixed(1)}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Protein</span>
                  <span className="text-sm font-semibold text-red-500">{(result.protein * servingsMultiplier).toFixed(1)}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fat</span>
                  <span className="text-sm font-semibold text-amber-500">{(result.fat * servingsMultiplier).toFixed(1)}g</span>
                </div>
              </div>

              {/* Ingredients parsed */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Identified Ingredients:</h4>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {result.ingredients.map((ing, k) => (
                    <div key={k} className="flex items-start gap-2 bg-white/75 border border-slate-100 rounded-lg p-2 text-xs text-slate-600 font-sans">
                      <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                      <span>{ing}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Log to Meal</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:border-green-500"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snacks">Snacks</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Servings quantity</label>
                  <div className="flex items-center border border-slate-200 bg-white rounded-xl">
                    <button
                      onClick={() => setServingsMultiplier(m => Math.max(0.5, m - 0.5))}
                      className="px-3 py-1.5 font-bold hover:bg-slate-50 transition-colors rounded-l-xl text-slate-500 text-sm"
                    >
                      -
                    </button>
                    <span className="flex-1 font-mono text-center text-xs text-slate-700 font-bold">{servingsMultiplier}x</span>
                    <button
                      onClick={() => setServingsMultiplier(m => m + 0.5)}
                      className="px-3 py-1.5 font-bold hover:bg-slate-50 transition-colors rounded-r-xl text-slate-500 text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setResult(null)}
                className="w-2/5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-sans font-medium text-xs py-3.5 transition-colors flex items-center justify-center gap-1"
              >
                Clear / Recut
              </button>
              <button
                onClick={handleAddToDiary}
                disabled={loggingProgress || loggedMeal}
                className="w-3/5 rounded-xl bg-green-500 hover:bg-green-600 text-black font-sans font-bold text-xs py-3.5 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                {loggingProgress ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : loggedMeal ? (
                  <>
                    <Check className="h-4 w-4" />
                    Logged!
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Log Food to Diary
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

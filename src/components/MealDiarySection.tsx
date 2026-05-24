import React, { useEffect, useState } from "react";
import { Plus, Search, Trash2, ShieldAlert, Sparkles, ChevronDown, Check, Undo, ArrowLeft, Camera, Layers, Flame, ArrowRight, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FoodLog, CustomFood } from "../types";
import BarcodeScanner from "./BarcodeScanner";

interface MealDiarySectionProps {
  foods: FoodLog[];
  token: string;
  onUpdate: () => void;
}

export default function MealDiarySection({ foods, token, onUpdate }: MealDiarySectionProps) {
  const [activeMealGroup, setActiveMealGroup] = useState<"breakfast" | "lunch" | "dinner" | "snacks" | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomFood[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Selected config details for log
  const [selectedFood, setSelectedFood] = useState<CustomFood | null>(null);
  const [logQty, setLogQty] = useState(1);
  const [customServing, setCustomServing] = useState("1 serving");

  // Custom quick add calorie states
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickCalories, setQuickCalories] = useState("150");
  const [quickProtein, setQuickProtein] = useState("10");
  const [quickCarbs, setQuickCarbs] = useState("15");
  const [quickFats, setQuickFats] = useState("5");

  // Custom permanent foods creator states
  const [showCreateCustom, setShowCreateCustom] = useState(false);
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodCalories, setNewFoodCalories] = useState("");
  const [newFoodProtein, setNewFoodProtein] = useState("");
  const [newFoodCarbs, setNewFoodCarbs] = useState("");
  const [newFoodFats, setNewFoodFats] = useState("");
  const [newFoodServing, setNewFoodServing] = useState("100g");
  const [newFoodBarcode, setNewFoodBarcode] = useState("");

  // UndoSnackbar notifications states
  const [undoLog, setUndoLog] = useState<Omit<FoodLog, "id" | "user_id" | "created_at"> | null>(null);
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);
  const [snackbarTimeout, setSnackbarTimeout] = useState<any>(null);

  useEffect(() => {
    if (activeMealGroup) {
      handleSearch("");
    }
  }, [activeMealGroup]);

  // API Search query triggered
  async function handleSearch(term: string) {
    setLoadingSearch(true);
    try {
      const response = await fetch(`/api/foods/search?q=${encodeURIComponent(term)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  }

  // Deletion logic with interactive undo fallback timer
  async function handleDelete(logItem: FoodLog) {
    // Stage deletion details for undo support
    setUndoLog({
      food_name: logItem.food_name,
      meal_type: logItem.meal_type,
      serving_size: logItem.serving_size,
      quantity: logItem.quantity,
      calories: logItem.calories,
      protein_g: logItem.protein_g,
      carbs_g: logItem.carbs_g,
      fat_g: logItem.fat_g,
      logged_at: logItem.logged_at
    });

    try {
      const res = await fetch(`/api/food/log/${logItem.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        onUpdate();
        
        // Flash undo snackbar bottom-center for 3 seconds as required
        setShowUndoSnackbar(true);
        if (snackbarTimeout) clearTimeout(snackbarTimeout);
        
        const timer = setTimeout(() => {
          setShowUndoSnackbar(false);
          setUndoLog(null);
        }, 4000);
        setSnackbarTimeout(timer);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Retrieve deleted item securely on user demand
  async function handleUndoDelete() {
    if (!undoLog) return;
    try {
      const res = await fetch("/api/food/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(undoLog)
      });
      if (res.ok) {
        onUpdate();
        setShowUndoSnackbar(false);
        setUndoLog(null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Double-tap or select food catalog to add dynamically to active diary
  async function handleAddFoodLog(foodItem: CustomFood) {
    const calTotal = Math.round(foodItem.calories * logQty);
    const protTotal = Number((foodItem.protein_g * logQty).toFixed(1));
    const carbTotal = Number((foodItem.carbs_g * logQty).toFixed(1));
    const fatTotal = Number((foodItem.fat_g * logQty).toFixed(1));

    try {
      const response = await fetch("/api/food/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          food_name: foodItem.name,
          meal_type: activeMealGroup,
          serving_size: customServing || foodItem.serving_size,
          quantity: logQty,
          calories: calTotal,
          protein_g: protTotal,
          carbs_g: carbTotal,
          fat_g: fatTotal,
          logged_at: new Date().toISOString().split("T")[0]
        })
      });

      if (response.ok) {
        onUpdate();
        setSelectedFood(null);
        setLogQty(1);
        setShowAddModal(false);
        setActiveMealGroup(null);
      }
    } catch (err) {
      console.error("Diary injection failing:", err);
    }
  }

  // Complete quick manual calorie add mapping
  async function handleQuickAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quickName) return;

    try {
      const response = await fetch("/api/food/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          food_name: quickName,
          meal_type: activeMealGroup,
          serving_size: "1 custom serve",
          quantity: 1,
          calories: Math.round(Number(quickCalories)),
          protein_g: Number(quickProtein) || 0,
          carbs_g: Number(quickCarbs) || 0,
          fat_g: Number(quickFats) || 0,
          logged_at: new Date().toISOString().split("T")[0]
        })
      });

      if (response.ok) {
        onUpdate();
        setQuickName("");
        setShowQuickAdd(false);
        setShowAddModal(false);
        setActiveMealGroup(null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Complete permanent database custom food submission
  async function handleCreateCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newFoodName || !newFoodCalories) return;

    try {
      const resp = await fetch("/api/foods/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newFoodName,
          calories: Number(newFoodCalories),
          protein_g: Number(newFoodProtein) || 0,
          carbs_g: Number(newFoodCarbs) || 0,
          fat_g: Number(newFoodFats) || 0,
          serving_size: newFoodServing,
          barcode: newFoodBarcode
        })
      });

      if (resp.ok) {
        setNewFoodName("");
        setNewFoodCalories("");
        setNewFoodProtein("");
        setNewFoodCarbs("");
        setNewFoodFats("");
        setNewFoodBarcode("");
        setShowCreateCustom(false);
        // Refresh catalog instantly
        handleSearch(searchQuery);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Filter food groups
  const renderMealGroupItems = (group: "breakfast" | "lunch" | "dinner" | "snacks") => {
    const list = foods.filter(f => f.meal_type === group);
    const sumCals = list.reduce((acc, curr) => acc + curr.calories, 0);

    return (
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow transition-shadow">
        {/* Card title headers */}
        <div className="flex items-center justify-between bg-slate-50/60 px-5 py-4 border-b border-slate-100">
          <div>
            <span className="font-sans font-extrabold text-slate-800 text-sm capitalize">{group}</span>
            <span className="text-[10px] text-slate-400 block font-semibold">{list.length} item(s) logged</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono font-black text-slate-700 text-sm">{sumCals} kcal</span>
            <button
              onClick={() => {
                setActiveMealGroup(group);
                setShowAddModal(true);
              }}
              className="rounded-full bg-green-50 hover:bg-green-100 text-green-700 text-xs px-3 py-1 font-bold flex items-center gap-1 transition-all"
              id={`add-${group}-btn`}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Food
            </button>
          </div>
        </div>

        {/* Log list mapping */}
        <div className="divide-y divide-slate-100">
          {list.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-xs text-slate-400 font-sans">No {group} logged yet. Complete diary targets!</span>
            </div>
          ) : (
            list.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-slate-850 text-xs text-slate-800">{item.food_name}</span>
                    <span className="text-[9px] text-slate-400 font-mono font-bold bg-slate-100 px-1 py-0.5 rounded uppercase">
                      {item.serving_size} x{item.quantity}
                    </span>
                  </div>
                  {/* Small Nutrition labels subtext */}
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium pt-0.5 font-mono">
                    <span>Prot: {Math.round(item.protein_g * item.quantity)}g</span>
                    <span>Carbs: {Math.round(item.carbs_g * item.quantity)}g</span>
                    <span>Fats: {Math.round(item.fat_g * item.quantity)}g</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 h-full">
                  <span className="font-mono font-bold text-slate-800 text-sm">{item.calories} kcal</span>
                  <button
                    onClick={() => handleDelete(item)}
                    className="text-slate-400 hover:text-red-500 rounded p-1"
                    title="Delete item"
                    id={`delete-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5" id="meal-diary-panel-group">
      {renderMealGroupItems("breakfast")}
      {renderMealGroupItems("lunch")}
      {renderMealGroupItems("dinner")}
      {renderMealGroupItems("snacks")}

      {/* Dynamic Floating Undo Toast trigger */}
      <AnimatePresence>
        {showUndoSnackbar && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 px-5 py-3.5 rounded-full flex items-center gap-4 shadow-xl text-white max-w-sm w-full"
            id="undo-toast-alert"
          >
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold">Removed logged item</p>
              <p className="text-[10px] text-slate-400 truncate font-mono">{undoLog?.food_name}</p>
            </div>
            <button
              onClick={handleUndoDelete}
              className="text-xs font-bold text-green-400 uppercase py-1 px-3 hover:bg-slate-800 rounded-full flex items-center gap-1 transition"
            >
              <Undo className="h-4.5 w-4.5" /> Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LARGE SEARCH AND SELECTION MODAL ADD FOOD DIALOGS */}
      <AnimatePresence>
        {showAddModal && activeMealGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          >
            <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" id="add-food-picker-dialog">
              
              {/* Modal Banner */}
              <div className="flex items-center justify-between border-b px-6 py-4 bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="font-sans font-black text-slate-800 text-lg capitalize">Logging {activeMealGroup}</span>
                  <div className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    MFP Search
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setActiveMealGroup(null);
                    setSelectedFood(null);
                  }}
                  className="rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 font-bold p-2 text-xs"
                >
                  &times;
                </button>
              </div>

              {/* Sticky Search bar row */}
              <div className="p-5 border-b border-slate-100 bg-white flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search over 14 million nutrient food list items..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-green-500"
                    id="search-foods-catalog"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Barcode scan camera prompt triggers */}
                <button
                  onClick={() => setShowScanner(true)}
                  className="rounded-xl border border-slate-200 hover:bg-slate-50 px-3 flex items-center justify-center text-slate-600 transition-colors shadow-sm"
                  title="Scan product barcode"
                  id="launcher-bc-scan"
                >
                  <Camera className="h-4 w-4 text-green-500" />
                </button>
              </div>

              {/* Sub features headers shortcuts */}
              <div className="flex border-b border-slate-100 text-[11px] font-bold text-slate-500 px-5">
                <button
                  onClick={() => { setShowQuickAdd(false); setShowCreateCustom(false); }}
                  className={`py-3 px-3 border-b-2 ${(!showQuickAdd && !showCreateCustom) ? "border-green-500 text-slate-800" : "border-transparent"}`}
                >
                  Database Search
                </button>
                <button
                  onClick={() => { setShowQuickAdd(true); setShowCreateCustom(false); }}
                  className={`py-3 px-3 border-b-2 ${showQuickAdd ? "border-green-500 text-slate-800" : "border-transparent"}`}
                >
                  Quick Add Cals
                </button>
                <button
                  onClick={() => { setShowQuickAdd(false); setShowCreateCustom(true); }}
                  className={`py-3 px-3 border-b-2 ${showCreateCustom ? "border-green-500 text-slate-800" : "border-transparent"}`}
                >
                  Create Custom Food
                </button>
              </div>

              {/* Dynamic scroll content center */}
              <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
                
                {/* 1. Standard search screen */}
                {!showQuickAdd && !showCreateCustom && (
                  <>
                    {selectedFood ? (
                      /* CONFIG LOG ADD CARD */
                      <motion.div
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-5 rounded-2xl border border-green-500/20 bg-white shadow-md space-y-4 text-slate-700"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <button
                              onClick={() => setSelectedFood(null)}
                              className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 hover:text-slate-700 mb-2"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" /> Back to matches
                            </button>
                            <h4 className="font-sans font-extrabold text-sm text-slate-800">{selectedFood.name}</h4>
                            <p className="text-xs text-slate-500">Serving Base: {selectedFood.serving_size}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-2xl font-black text-green-500 block">{Math.round(selectedFood.calories * logQty)}</span>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Kcal budget</span>
                          </div>
                        </div>

                        {/* Serving parameters adjustment */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Portion Measurement (e.g. 1 slice, 100g)</label>
                            <input
                              type="text"
                              value={customServing}
                              onChange={(e) => setCustomServing(e.target.value)}
                              className="w-full text-xs rounded-lg border p-2 bg-slate-50"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Serving Quantity</label>
                            <div className="flex border rounded-lg bg-slate-50 text-slate-700 font-mono text-xs items-center max-w-[150px]">
                              <button
                                onClick={() => setLogQty(q => Math.max(0.5, q - 0.5))}
                                className="px-3 py-1.5 hover:bg-slate-100 font-bold text-sm"
                              >
                                -
                              </button>
                              <span className="flex-1 text-center font-bold">{logQty}</span>
                              <button
                                onClick={() => setLogQty(q => q + 0.5)}
                                className="px-3 py-1.5 hover:bg-slate-100 font-bold text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Micronutrient indicators preview */}
                        <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50 rounded-xl border text-center font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Carbs</span>
                            <span className="text-xs font-bold font-mono text-slate-700">{(selectedFood.carbs_g * logQty).toFixed(1)}g</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Protein</span>
                            <span className="text-xs font-bold font-mono text-slate-700">{(selectedFood.protein_g * logQty).toFixed(1)}g</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Fat</span>
                            <span className="text-xs font-bold font-mono text-slate-700">{(selectedFood.fat_g * logQty).toFixed(1)}g</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddFoodLog(selectedFood)}
                          className="w-full py-2.5 bg-green-500 hover:bg-green-600 transition-colors text-black font-sans font-bold text-xs rounded-xl shadow-sm text-center"
                        >
                          Confirm & Add to {activeMealGroup}
                        </button>
                      </motion.div>
                    ) : (
                      /* SEARCH MATCH RESULTS */
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400 mb-1">Matching items:</span>
                        {searchResults.length === 0 ? (
                          <div className="text-center py-10 bg-white border border-slate-100 rounded-2xl">
                            <p className="text-xs text-slate-400 font-medium">Type query inside Search to browse matched food items.</p>
                          </div>
                        ) : (
                          searchResults.map((food) => (
                            <div
                              key={food.id}
                              onClick={() => {
                                setSelectedFood(food);
                                setCustomServing(food.serving_size);
                                setLogQty(1);
                              }}
                              className="bg-white border rounded-2xl p-4 flex items-center justify-between hover:border-green-500/50 cursor-pointer shadow-sm hover:shadow transition-all group"
                            >
                              <div>
                                <span className="font-sans font-bold text-slate-800 text-xs block group-hover:text-green-600 transition-colors">
                                  {food.name}
                                </span>
                                <span className="text-[10px] text-slate-400 block">{food.serving_size}</span>
                                {/* Nutrients summary badges */}
                                <div className="flex gap-2 text-[9px] font-bold font-mono text-slate-400 pt-1">
                                  <span className="bg-blue-50 text-blue-500 px-1 py-0.5 rounded">C: {food.carbs_g}g</span>
                                  <span className="bg-red-50 text-red-500 px-1 py-0.5 rounded">P: {food.protein_g}g</span>
                                  <span className="bg-amber-50 text-amber-600 px-1 py-0.5 rounded">F: {food.fat_g}g</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-black text-slate-700">{food.calories} kcal</span>
                                <button className="rounded-full bg-slate-50 p-1 group-hover:bg-green-50 group-hover:text-green-500 transition-colors">
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* 2. Quick add card */}
                {showQuickAdd && (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleQuickAddSubmit}
                    className="p-5 bg-white border rounded-2xl shadow-sm space-y-4"
                  >
                    <h4 className="font-sans font-bold text-sm text-slate-800">Quick Caloric Tracker Addition</h4>
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Food / Description</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Starbucks Latte"
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 border rounded-lg focus:outline-none focus:bg-white"
                        id="quick-add-food-name"
                      />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Calories (kcal)</label>
                        <input
                          type="number"
                          required
                          value={quickCalories}
                          onChange={(e) => setQuickCalories(e.target.value)}
                          className="w-full text-xs p-2 bg-slate-50 border rounded-lg focus:outline-none"
                          id="quick-add-calories-input"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Protein (g)</label>
                        <input
                          type="number"
                          value={quickProtein}
                          onChange={(e) => setQuickProtein(e.target.value)}
                          className="w-full text-xs p-2 bg-slate-50 border rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Carbs (g)</label>
                        <input
                          type="number"
                          value={quickCarbs}
                          onChange={(e) => setQuickCarbs(e.target.value)}
                          className="w-full text-xs p-2 bg-slate-50 border rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Fats (g)</label>
                        <input
                          type="number"
                          value={quickFats}
                          onChange={(e) => setQuickFats(e.target.value)}
                          className="w-full text-xs p-2 bg-slate-50 border rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!quickName}
                      className="w-full py-2.5 bg-green-500 text-black font-sans font-bold text-xs rounded-xl shadow-sm hover:bg-green-600 transition"
                      id="confirm-quick-add"
                    >
                      Instant log custom metrics
                    </button>
                  </motion.form>
                )}

                {/* 3. Create Custom Food permanently */}
                {showCreateCustom && (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleCreateCustomSubmit}
                    className="p-5 bg-white border rounded-2xl shadow-sm space-y-4 text-slate-700"
                  >
                    <h4 className="font-sans font-bold text-sm text-slate-800">Add custom item to global catalogue database</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Food Product Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Oats Power Bar"
                          value={newFoodName}
                          onChange={(e) => setNewFoodName(e.target.value)}
                          className="w-full text-xs p-2 border bg-slate-50 rounded-lg focus:outline-none focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Serving Measurement</label>
                        <input
                          type="text"
                          placeholder="e.g. 1 packet (50g)"
                          value={newFoodServing}
                          onChange={(e) => setNewFoodServing(e.target.value)}
                          className="w-full text-xs p-2 border bg-slate-50 rounded-lg focus:outline-none focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Barcode Serial code (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 000000000021"
                          value={newFoodBarcode}
                          onChange={(e) => setNewFoodBarcode(e.target.value)}
                          className="w-full text-xs p-2 border bg-slate-50 rounded-lg font-mono placeholder:font-sans"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Calories per unit (kcal)</label>
                        <input
                          type="number"
                          required
                          placeholder="Calories Count"
                          value={newFoodCalories}
                          onChange={(e) => setNewFoodCalories(e.target.value)}
                          className="w-full text-xs p-2 border bg-slate-50 rounded-lg focus:outline-none focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 mb-1 block">Protein (g)</label>
                        <input
                          type="number"
                          placeholder="0g"
                          value={newFoodProtein}
                          onChange={(e) => setNewFoodProtein(e.target.value)}
                          className="w-full text-xs p-2 border bg-slate-50 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 mb-1 block">Carbohydrates (g)</label>
                        <input
                          type="number"
                          placeholder="0g"
                          value={newFoodCarbs}
                          onChange={(e) => setNewFoodCarbs(e.target.value)}
                          className="w-full text-xs p-2 border bg-slate-50 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 mb-1 block">Fat (g)</label>
                        <input
                          type="number"
                          placeholder="0g"
                          value={newFoodFats}
                          onChange={(e) => setNewFoodFats(e.target.value)}
                          className="w-full text-xs p-2 border bg-slate-50 rounded-lg"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!newFoodName || !newFoodCalories}
                      className="w-full py-2.5 bg-slate-800 text-white font-sans font-bold text-xs rounded-xl hover:bg-slate-900 transition-colors"
                    >
                      Save to My Foods Dictionary
                    </button>
                  </motion.form>
                )}

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Barcode modal overlays */}
      <AnimatePresence>
        {showScanner && (
          <BarcodeScanner
            token={token}
            onClose={() => setShowScanner(false)}
            onScanSuccess={(item) => {
              setShowScanner(false);
              setSelectedFood(item);
              setCustomServing(item.serving_size);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

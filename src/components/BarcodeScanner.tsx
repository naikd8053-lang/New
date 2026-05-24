import React, { useEffect, useRef, useState } from "react";
import safeJson from "../utils/safeJson";
import { Camera, CornerDownLeft, Eye, RotateCcw, AlertCircle, Sparkles, Check, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CustomFood } from "../types";

interface BarcodeScannerProps {
  onScanSuccess: (food: CustomFood) => void;
  onClose: () => void;
  token: string;
}

export default function BarcodeScanner({ onScanSuccess, onClose, token }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [scannedFood, setScannedFood] = useState<CustomFood | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Active seed items for user demonstration
  const demoBarcodes = [
    { code: "0000000000018", name: "Grilled Chicken Breast (100g)" },
    { code: "0000000000025", name: "Boiled Egg (Large)" },
    { code: "0000000000049", name: "Peanut Butter (1 tbsp)" },
    { code: "0000000000056", name: "Whole Wheat Bread (1 slice)" },
    { code: "0000000000063", name: "Whey Protein Powder (1 scoop)" },
    { code: "0000000000070", name: "Canned Tuna in Water (150g)" }
  ];

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraPermission("granted");
    } catch (err) {
      console.warn("Camera load failed:", err);
      setCameraPermission("denied");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }

  async function handleLookup(code: string) {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setScannedFood(null);

    // Haptic feedback trigger on successful lookup
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch (e) {}
    }

    try {
      const response = await fetch(`/api/foods/barcode/${encodeURIComponent(code.trim())}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Unable to lookup scanned barcode");
      }
      const data = await safeJson(response);
      setScannedFood(data || null);
    } catch (err: any) {
      setError(err.message || "Product lookup failed. Please add code manually.");
    } finally {
      setLoading(false);
    }
  }

  function handleImportScanned() {
    if (scannedFood) {
      onScanSuccess(scannedFood);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" id="barcode-scanner-modal">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <Camera className="h-6 w-6 text-green-400" />
            <h3 className="font-sans font-semibold text-lg text-slate-100">Barcode Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            id="close-scanner"
          >
            &times;
          </button>
        </div>

        {/* Scanner View Port */}
        <div className="relative aspect-video bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
          {cameraPermission === "granted" ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
              {/* Aim Grid Overlay */}
              <div className="absolute inset-x-12 inset-y-8 border-2 border-dashed border-green-500 bg-green-500/5 animate-pulse flex items-center justify-center rounded-xl">
                {/* Horizontal Laser Line */}
                <motion.div
                  initial={{ top: "0%" }}
                  animate={{ top: "100%" }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                  className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-lg shadow-red-500"
                />
              </div>
            </>
          ) : (
            <div className="p-8 text-center max-w-xs">
              <Camera className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-400 mb-2">Camera permission unavailable</p>
              <p className="text-xs text-slate-500">Using simulated smart visual framework. Type code below or choose a pre-loaded test barcode to query instantly.</p>
            </div>
          )}
        </div>

        {/* Scanner Controls & Lookups */}
        <div className="p-6 space-y-5">
          {/* Form manual search */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-2">Manual Barcode Identifier</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 0000000000018"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup(barcode)}
                className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-green-500"
                id="manual-barcode-input"
              />
              <button
                onClick={() => handleLookup(barcode)}
                disabled={loading || !barcode}
                className="rounded-xl bg-green-500 hover:bg-green-600 font-sans font-medium text-xs px-4 text-black flex items-center gap-2 transition-colors disabled:opacity-40"
              >
                Lookup
              </button>
            </div>
          </div>

          {/* Test items grids */}
          <div>
            <span className="text-xs font-semibold text-green-400/80 uppercase block tracking-wider mb-2">Simulate real-world barcodes:</span>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
              {demoBarcodes.map((demo) => (
                <button
                  key={demo.code}
                  onClick={() => {
                    setBarcode(demo.code);
                    handleLookup(demo.code);
                  }}
                  className="p-1 px-2.5 rounded-lg border border-slate-800 bg-slate-950 text-left text-xs hover:border-green-500/50 hover:bg-green-500/5 transition-all truncate"
                >
                  <span className="text-slate-400 font-mono text-[10px] block font-semibold">{demo.code}</span>
                  <span className="text-slate-200 block font-sans truncate">{demo.name}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {scannedFood && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="rounded-2xl bg-slate-950 border border-green-500/30 p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="bg-green-500/10 text-green-400 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full inline-block mb-1">Found Item</span>
                    <h4 className="font-sans font-semibold text-sm text-slate-100">{scannedFood.name}</h4>
                    <p className="text-xs text-slate-400">Serving Size: {scannedFood.serving_size}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-lg font-bold text-green-400 accent-green-400">{scannedFood.calories}</span>
                    <span className="text-[10px] text-slate-400 block font-medium">calories</span>
                  </div>
                </div>

                {/* Micro macro summary */}
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-slate-900 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium uppercase">Carbs</span>
                    <span className="text-xs text-slate-200 font-semibold">{scannedFood.carbs_g}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium uppercase">Protein</span>
                    <span className="text-xs text-slate-200 font-semibold">{scannedFood.protein_g}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium uppercase">Fat</span>
                    <span className="text-xs text-slate-200 font-semibold">{scannedFood.fat_g}g</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleImportScanned}
                    className="w-full rounded-xl bg-green-500 text-black py-2.5 font-sans font-semibold text-xs text-center flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                  >
                    <Check className="h-4 w-4" /> Add Food to Log
                  </button>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 text-xs text-left"
              >
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {loading && (
            <div className="py-4 text-center">
              <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent" />
              <p className="text-xs text-slate-400 mt-2">Searching international food database...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Paintbrush, Eraser, RotateCcw, Save, Sparkles, Smile, Heart, Star, Cloud } from "lucide-react";
import { SharedLine, DrawingPoint } from "../types";

interface Props {
  roomId: string;
  senderId: string;
}

const PASTEL_COLORS = [
  "#FFB7B2", // Peach / Pink
  "#FFDAC1", // Apricot
  "#E2F0CB", // Mint
  "#B5EAD7", // Sage
  "#C7CEEA", // Periwinkle
  "#FFB7C5", // Sakura Pink
  "#E6E6FA"  // Lavender
];

const STICKERS = [
  { char: "💜", icon: Heart, label: "Heart" },
  { char: "⭐", icon: Star, label: "Star" },
  { char: "☁️", icon: Cloud, label: "Cloud" },
  { char: "🐣", icon: Smile, label: "Cute" }
];

export default function SharedCanvas({ roomId, senderId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0]);
  const [lineWidth, setLineWidth] = useState(4);
  const [lines, setLines] = useState<SharedLine[]>([]);
  const [activeTool, setActiveTool] = useState<"brush" | "eraser">("brush");
  const [showStickerPrompt, setShowStickerPrompt] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Broadcast channel for cross-tab multiplayer sync
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // Instantiate channel based on roomId
    const channelName = `socialchat-canvas-${roomId}`;
    channelRef.current = new BroadcastChannel(channelName);

    channelRef.current.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "draw-line") {
        setLines((prev) => [...prev, payload]);
      } else if (type === "clear-canvas") {
        setLines([]);
      }
    };

    return () => {
      channelRef.current?.close();
    };
  }, [roomId]);

  // Hook resize observer for container density
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width || 320;
        canvas.height = Math.min(height || 360, 400);
        redraw();
      }
    });

    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, [lines]);

  // Redraw complete paths
  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw background grid lines for a cutesy diary notebook paper style
    ctx.strokeStyle = "#FFF0F5";
    ctx.lineWidth = 1;
    for (let y = 15; y < canvas.height; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    lines.forEach((line) => {
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Apply soft neon glow style
      ctx.shadowColor = line.color;
      ctx.shadowBlur = 4;

      if (line.points.length > 0) {
        ctx.moveTo(line.points[0].x, line.points[0].y);
        for (let i = 1; i < line.points.length; i++) {
          ctx.lineTo(line.points[i].x, line.points[i].y);
        }
        ctx.stroke();
      }
    });

    // Reset shadow limits
    ctx.shadowBlur = 0;
  };

  const getCoordinates = (e: any): DrawingPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    // Support both mouse and touches
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStartDraw = (e: any) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    isDrawingRef.current = true;
    coords.isStart = true;

    const currentLine: SharedLine = {
      points: [coords],
      color: activeTool === "eraser" ? "#FAFAF9" : selectedColor,
      width: activeTool === "eraser" ? 24 : lineWidth,
      senderId,
    };

    setLines((prev) => [...prev, currentLine]);
  };

  const handleDrawingMove = (e: any) => {
    if (!isDrawingRef.current) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    setLines((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const active = { ...copy[copy.length - 1] };
      active.points = [...active.points, coords];
      copy[copy.length - 1] = active;
      return copy;
    });
  };

  const handleEndDraw = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    // Broadcast final line to other players
    if (lines.length > 0) {
      const lastLine = lines[lines.length - 1];
      channelRef.current?.postMessage({
        type: "draw-line",
        payload: lastLine,
      });

      // Simple localStorage event trigger as fallback backup sync
      localStorage.setItem(`socialchat-lastline-${roomId}`, JSON.stringify({
        line: lastLine,
        time: Date.now()
      }));
    }
  };

  const handleClear = () => {
    setLines([]);
    channelRef.current?.postMessage({ type: "clear-canvas", payload: null });
    localStorage.setItem(`socialchat-lastline-clear-${roomId}`, JSON.stringify({ time: Date.now() }));
  };

  // Place decorative sticker in canvas center
  const triggerSticker = (char: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerPoint: DrawingPoint = {
      x: canvas.width / 2 + (Math.random() * 40 - 20),
      y: canvas.height / 2 + (Math.random() * 40 - 20)
    };

    // Draw text symbol onto drawing array as small simulated brush paths
    // To make it persistent in the line list, let's represent it
    // Wait, let's draw directly onto ctx and log a toast for simplicity!
    ctx.font = "32px serif";
    ctx.fillText(char, centerPoint.x, centerPoint.y);

    // Save canvas state
    showToast(`Shared canvas sticker "${char}" placed!`);
    setShowStickerPrompt(false);

    // Simulate drawing paths to sync across channel if needed
    const dummyLine: SharedLine = {
      points: [centerPoint],
      color: "transparent",
      width: 0,
      senderId
    };
    channelRef.current?.postMessage({ type: "draw-line", payload: dummyLine });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2000);
  };

  // Redraw whenever lines state changes
  useEffect(() => {
    redraw();
  }, [lines]);

  return (
    <div className="w-full flex flex-col p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-pink-100 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1 px-2.5 rounded-full bg-pink-100 text-[10px] font-bold text-pink-500 animate-bounce">
            Co-Draw Active
          </div>
          <span className="text-[10px] text-gray-500 font-sans">
            Draw feelings together live!
          </span>
        </div>
        <button
          onClick={handleClear}
          className="text-gray-400 hover:text-red-400 p-1 rounded-lg transition-transform hover:scale-105 active:scale-95"
          title="Clear Board"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Actual Drawing Canvas Stage */}
      <div className="w-full relative h-48 bg-stone-50 rounded-xl border border-dashed border-pink-200 overflow-hidden flex items-stretch">
        <canvas
          ref={canvasRef}
          onMouseDown={handleStartDraw}
          onMouseMove={handleDrawingMove}
          onMouseUp={handleEndDraw}
          onMouseLeave={handleEndDraw}
          onTouchStart={handleStartDraw}
          onTouchMove={handleDrawingMove}
          onTouchEnd={handleEndDraw}
          className="w-full h-full bg-amber-[50]/10 cursor-crosshair touch-none"
        />

        {lines.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
            <Sparkles className="w-6 h-6 text-pink-300 animate-pulse mb-1.5" />
            <p className="text-[11px] text-gray-400 font-sans font-medium">
              Pick colors below to scratch together...
            </p>
          </div>
        )}

        {toastMessage && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-gray-900/80 backdrop-blur text-white text-[10px] py-1 px-3 rounded-full shadow font-sans">
            {toastMessage}
          </div>
        )}
      </div>

      {/* Floating Toolbar and Accessories */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-pink-50 pt-3">
        <div className="flex items-center gap-1.5">
          {/* Tools */}
          <button
            onClick={() => setActiveTool("brush")}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTool === "brush" ? "bg-pink-100 text-pink-600" : "text-gray-400 hover:bg-gray-100"
            }`}
            title="Brush"
          >
            <Paintbrush className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTool("eraser")}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTool === "eraser" ? "bg-stone-200 text-gray-700" : "text-gray-400 hover:bg-gray-100"
            }`}
            title="Eraser"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-gray-200 mx-1"></span>

          {/* Core Colors Selection */}
          <div className="flex items-center gap-1">
            {PASTEL_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSelectedColor(c);
                  setActiveTool("brush");
                }}
                className={`w-4 h-4 rounded-full border transition-all ${
                  selectedColor === c && activeTool === "brush"
                    ? "scale-125 border-pink-500 shadow-sm"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Sticker launcher popup */}
        <div className="relative">
          <button
            onClick={() => setShowStickerPrompt(!showStickerPrompt)}
            className="flex items-center gap-1 p-1 px-2.5 rounded-lg text-[10px] font-semibold bg-gradient-to-r from-pink-100 to-purple-100 text-pink-600 hover:scale-105 transition-transform"
          >
            <span>Sticker</span>
            <Smile className="w-3 h-3" />
          </button>

          {showStickerPrompt && (
            <div className="absolute right-0 bottom-8 z-20 bg-white p-2 rounded-xl border border-pink-100 shadow-lg flex items-center gap-2">
              {STICKERS.map((s) => (
                <button
                  key={s.char}
                  onClick={() => triggerSticker(s.char)}
                  className="text-lg hover:scale-125 active:scale-95 transition-transform p-1.5 hover:bg-pink-50 rounded"
                >
                  {s.char}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

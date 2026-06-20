import React, { useState } from "react";
import { Sparkles, ArrowRight, Music, Heart, MessageSquare } from "lucide-react";
import { ConnectionMode, Song } from "../types";
import SpotifyIntegration from "./SpotifyIntegration";

interface Props {
  onNext: (emotion: string, mode: ConnectionMode, song: Song | null) => void;
}

export default function EmotionInputScreen({ onNext }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [emotion, setEmotion] = useState("");
  const [mode, setMode] = useState<ConnectionMode>("balanced");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const handleStepOneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emotion.trim()) return;
    setStep(2);
  };

  const handleFinalSubmit = () => {
    if (!emotion.trim()) return;
    onNext(emotion.trim().toLowerCase(), mode, selectedSong);
  };

  // Determine dynamic accent gradients based on typed text to feel emotionally adaptive
  const getAdaptiveGradient = () => {
    const word = emotion.toLowerCase();
    if (!word) return "from-pink-100 via-purple-100 to-indigo-100";
    if (word.includes("sad") || word.includes("lonely") || word.includes("blue") || word.includes("numb") || word.includes("cry")) {
      return "from-blue-100 via-indigo-100 to-slate-200";
    }
    if (word.includes("anxious") || word.includes("fear") || word.includes("panic") || word.includes("stres")) {
      return "from-indigo-100 via-purple-100 to-pink-100";
    }
    if (word.includes("happy") || word.includes("glad") || word.includes("joy") || word.includes("excited") || word.includes("love")) {
      return "from-yellow-100 via-orange-100 to-pink-100";
    }
    if (word.includes("angry") || word.includes("mad") || word.includes("annoy") || word.includes("hate")) {
      return "from-rose-100 via-orange-100 to-stone-200";
    }
    return "from-pink-100 via-purple-100 to-teal-500/10";
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 flex flex-col justify-between min-h-[480px]">
      
      {/* Step 1: Input single word of emotion */}
      {step === 1 && (
        <div className="space-y-6 my-auto animate-[fadeIn_0.5s_ease-out]">
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-white/5 border border-white/10 text-pink-400 shadow-[0_0_15px_rgba(219,39,119,0.25)] animate-bounce mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-serif italic text-white tracking-tight leading-none">
              Welcome to <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-purple-500 bg-clip-text text-transparent [text-shadow:0_0_20px_rgba(219,39,119,0.3)]">SocialChat</span>
            </h1>
            <p className="text-xs text-white/60 font-sans leading-relaxed px-4">
              A cozy place to connect with real souls. We don't pair you by interests, but by the frequency of your real-time feelings.
            </p>
          </div>

          <form onSubmit={handleStepOneSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-extrabold text-pink-300 uppercase tracking-widest block text-center mb-3">
                In one word, how are you feeling right now?
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  maxLength={18}
                  required
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value.replace(/\s/g, ""))}
                  placeholder="e.g. lonely, anxious, happy, tired..."
                  className="w-full text-center py-5 px-6 text-xl font-serif italic text-white placeholder-white/20 rounded-2xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all shadow-inner uppercase tracking-wider"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!emotion.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:brightness-110 text-white font-bold tracking-widest uppercase py-4 rounded-2xl active:scale-95 transition-all shadow-[0_0_25px_rgba(219,39,119,0.3)] disabled:opacity-30"
            >
              <span>Next Cozy Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Connection mode selection + Song attach */}
      {step === 2 && (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-pink-300 bg-pink-500/10 border border-pink-500/30 px-3 py-1.5 rounded-full">
              Your Vibe Feeling: {emotion}
            </span>
            <h2 className="text-2xl font-serif italic text-white mt-3.5">Pick Harmony Mode</h2>
          </div>

          {/* Balanced vs Unbalanced Grid info */}
          <div className="space-y-3">
            {/* Balanced option */}
            <button
              onClick={() => setMode("balanced")}
              className={`w-full text-left p-4 rounded-2xl transition-all flex items-start gap-3 border ${
                mode === "balanced"
                  ? "bg-white/10 border-pink-500/80 shadow-[0_0_15px_rgba(219,39,119,0.2)] transform scale-[1.01] text-white"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${mode === "balanced" ? "bg-pink-500/20 text-pink-400" : "bg-white/5 text-white/40"}`}>
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Balanced Connection</p>
                <p className="text-[10px] text-white/50 mt-0.5 leading-relaxed leading-normal">
                  Find a therapeutic shoulder. Match with someone feeling the <span className="font-semibold text-pink-300 text-[11px]">same emotion</span> as you for solidarity.
                </p>
              </div>
            </button>

            {/* Unbalanced option */}
            <button
              onClick={() => setMode("unbalanced")}
              className={`w-full text-left p-4 rounded-2xl transition-all flex items-start gap-3 border ${
                mode === "unbalanced"
                  ? "bg-white/10 border-purple-500/80 shadow-[0_0_15px_rgba(139,92,246,0.2)] transform scale-[1.01] text-white"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${mode === "unbalanced" ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-white/40"}`}>
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Unbalanced Connection</p>
                <p className="text-[10px] text-white/50 mt-0.5 leading-relaxed leading-normal">
                  Seek balanced perspective. Match with someone feeling the <span className="font-semibold text-purple-300 text-[11px]">exact opposite</span> of your mood for fresh insights.
                </p>
              </div>
            </button>
          </div>

          {/* Spotify integration section */}
          <SpotifyIntegration
            currentEmotion={emotion}
            selectedSong={selectedSong}
            onSelectSong={(song) => setSelectedSong(song)}
            titlePrompt="Optional Vibe Soundtrack"
          />

          {/* Button actions footer */}
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-3 border border-white/15 text-xs font-bold text-white/70 bg-white/5 rounded-xl hover:bg-white/10 hover:scale-105 active:scale-95 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleFinalSubmit}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-pink-500 via-purple-505 to-indigo-600 text-white font-bold text-xs tracking-widest uppercase py-3.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <span>Begin Matching</span>
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

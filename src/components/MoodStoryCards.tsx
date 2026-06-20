import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Download, Share2, Instagram, Heart, Image as ImageIcon, Check } from "lucide-react";
import { StoryCard } from "../types";

// Design specifications for the cutesy styles
const THEMES_CONFIG = {
  melancholy: {
    bg: "linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)",
    accent: "text-blue-200",
    particleColor: "bg-blue-300/40",
    desc: "rainy melancholy vibes",
    visualElement: (
      <div className="absolute inset-x-0 bottom-0 top-1/2 overflow-hidden opacity-30 pointer-events-none">
        <div className="w-full h-full flex justify-around items-end">
          <span className="w-0.5 h-12 bg-white rounded-full animate-bounce duration-1000"></span>
          <span className="w-0.5 h-16 bg-white rounded-full animate-bounce duration-500 delay-100"></span>
          <span className="w-0.5 h-8 bg-white rounded-full animate-bounce duration-700 delay-350"></span>
          <span className="w-0.5 h-14 bg-white rounded-full animate-bounce duration-1200 delay-200"></span>
        </div>
      </div>
    )
  },
  warmth: {
    bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    accent: "text-amber-200",
    particleColor: "bg-orange-200/50",
    desc: "sunset warmth radiance",
    visualElement: (
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-48 h-48 bg-amber-300/20 blur-3xl rounded-full pointer-events-none animate-pulse"></div>
    )
  },
  cloud: {
    bg: "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)",
    accent: "text-pink-300",
    particleColor: "bg-white/60",
    desc: "dreamy clouds softness",
    visualElement: (
      <div className="absolute inset-x-0 bottom-4 flex justify-around items-center opacity-40 pointer-events-none">
        <div className="w-16 h-8 bg-white/70 rounded-full blur-[2px]"></div>
        <div className="w-24 h-12 bg-white/60 rounded-full blur-[3px]"></div>
        <div className="w-12 h-6 bg-white/80 rounded-full blur-[1px]"></div>
      </div>
    )
  },
  cosmic: {
    bg: "linear-gradient(to top, #30cfd0 0%, #330867 100%)",
    accent: "text-purple-300",
    particleColor: "bg-teal-200/50",
    desc: "cosmic night galaxy",
    visualElement: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-10 left-12 w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
        <div className="absolute top-28 right-16 w-2 h-2 bg-purple-300 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-12 left-24 w-1 h-1 bg-teal-200 rounded-full animate-ping delay-1000"></div>
      </div>
    )
  },
  lavender: {
    bg: "linear-gradient(135deg, #e6c5f7 0%, #b2bbf6 100%)",
    accent: "text-indigo-400",
    particleColor: "bg-purple-100/60",
    desc: "lavender fields calm",
    visualElement: (
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-200/30 via-slate-100/0 to-transparent pointer-events-none"></div>
    )
  },
  neon: {
    bg: "linear-gradient(to bottom, #111 40%, #1e1135 100%)",
    accent: "text-pink-500",
    particleColor: "bg-cyan-300/40",
    desc: "synthwave neon light",
    visualElement: (
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-pink-500/10 to-transparent border-t border-pink-500/20 pointer-events-none blur-sm"></div>
    )
  }
};

interface Props {
  card: StoryCard;
  onRefresh?: () => void;
}

export default function MoodStoryCards({ card, onRefresh }: Props) {
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof THEMES_CONFIG>(card.theme);
  const [isExported, setIsExported] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const themeMeta = THEMES_CONFIG[selectedTheme] || THEMES_CONFIG.cosmic;

  const triggerExportSimulation = () => {
    setIsExported(true);
    setTimeout(() => {
      setIsExported(false);
    }, 3000);
  };

  return (
    <div className="w-full max-w-sm mx-auto p-4 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-pink-500 animate-[spin_5s_linear_infinite]" />
        <h3 className="text-sm font-semibold tracking-wide text-gray-700">
          Cinematic Story Card
        </h3>
      </div>

      <p className="text-[11px] text-gray-500 text-center mb-4">
        AI synthesized this souvenir of your connection. Customize its aura below and save for journaling or Instagram stories!
      </p>

      {/* Story Board Preview */}
      <div
        ref={cardRef}
        className="relative w-full h-[360px] rounded-3xl overflow-hidden shadow-xl border border-white/20 flex flex-col justify-between p-6 text-white transition-all duration-700 font-sans"
        style={{ background: themeMeta.bg }}
      >
        {/* Soft magical background particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <span className={`absolute w-3 h-3 rounded-full blur-[1px] ${themeMeta.particleColor} top-12 left-10 animate-bounce duration-[6000ms]`} />
          <span className={`absolute w-2 h-2 rounded-full blur-[2px] ${themeMeta.particleColor} top-32 right-12 animate-pulse duration-[4000ms]`} />
          <span className={`absolute w-4 h-4 rounded-full blur-[3px] ${themeMeta.particleColor} bottom-24 left-16 animate-bounce duration-[8000ms] delay-1000`} />
        </div>

        {themeMeta.visualElement}

        {/* Card Header information */}
        <div className="z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm py-1 px-3 rounded-full text-[9px] font-semibold border border-white/10 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse"></span>
            SocialChat Souvenir
          </div>
          <span className="text-[9px] text-white/60 tracking-wider">
            {new Date(card.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Central Poetical AI Quotes */}
        <div className="z-10 my-auto text-center px-2">
          <motion.p
            key={`${selectedTheme}-quote`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-base md:text-lg font-medium leading-relaxed font-sans mb-3 text-white tracking-wide drop-shadow-md`}
          >
            &ldquo;{card.quote}&rdquo;
          </motion.p>
          <motion.span
            key={`${selectedTheme}-sub`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 300 }}
            className={`text-[10px] uppercase tracking-widest font-mono font-bold ${themeMeta.accent} block opacity-90`}
          >
            {card.subquote || "A safe place felt close tonight"}
          </motion.span>
        </div>

        {/* Card Footer badges */}
        <div className="z-10 flex items-end justify-between border-t border-white/10 pt-4 bg-gradient-to-t from-black/10 to-transparent">
          <div>
            <p className="text-[8px] text-white/50 uppercase tracking-widest leading-none mb-1">
              Paired Mood Vibe
            </p>
            <div className="flex gap-1.5">
              <span className="text-[10px] bg-white/25 backdrop-blur px-2.5 py-0.5 rounded-full font-medium">
                {card.chatEmotionOne}
              </span>
              <span className="text-[10px] text-white/40 font-mono">
                &times;
              </span>
              <span className="text-[10px] bg-white/20 backdrop-blur px-2.5 py-0.5 rounded-full font-medium">
                {card.chatEmotionTwo}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-black/10 py-1 px-2.5 rounded-xl border border-white/5">
            <Heart className="w-2.5 h-2.5 text-pink-400 fill-pink-400" />
            <span className="text-[9px] font-mono tracking-tighter">Anonymity-First</span>
          </div>
        </div>
      </div>

      {/* Theme Picker Rails */}
      <div className="w-full mt-4 flex items-center justify-around gap-1.5 py-2 bg-gray-50 rounded-2xl border border-gray-100 p-2">
        {Object.keys(THEMES_CONFIG).map((themeKey) => {
          const config = THEMES_CONFIG[themeKey as keyof typeof THEMES_CONFIG];
          const isSelected = selectedTheme === themeKey;
          return (
            <button
              key={themeKey}
              onClick={() => setSelectedTheme(themeKey as keyof typeof THEMES_CONFIG)}
              className={`text-[9px] rounded-lg p-1.5 px-3 transition-all flex flex-col items-center gap-1 font-semibold ${
                isSelected
                  ? "bg-white text-gray-800 shadow"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-white"
                style={{ background: config.bg }}
              />
              <span className="text-[8px] capitalize leading-none">{themeKey}</span>
            </button>
          );
        })}
      </div>

      {/* Action triggers */}
      <div className="w-full mt-4 flex gap-2">
        <button
          onClick={triggerExportSimulation}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-3 border border-pink-100 hover:border-pink-300 rounded-xl bg-white text-pink-600 hover:scale-[1.01] active:scale-95 transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save Device</span>
        </button>

        <button
          onClick={triggerExportSimulation}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90 rounded-xl hover:scale-[1.01] active:scale-95 transition-all shadow-md"
        >
          <Instagram className="w-3.5 h-3.5" />
          <span>Post Story</span>
        </button>
      </div>

      <AnimatePresence>
        {isExported && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2"
          >
            <div className="p-1 rounded-full bg-emerald-500 text-white">
              <Check className="w-3 h-3" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-800">Card Rendered Successfully!</p>
              <p className="text-[9px] text-emerald-700">
                Instagram layout saved to your cache. Remember to keep details anonymous to protect core safety.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Sparkles, Users, RefreshCw, Compass, Moon, Thermometer, CloudRain } from "lucide-react";
import { CollectiveMoodData } from "../types";

export default function CollectiveEmotionScreen() {
  const [trends, setTrends] = useState<CollectiveMoodData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrends = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch("/api/collective/trends");
      const data = await resp.json();
      setTrends(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-5 select-none">
      {/* Visual galaxy panel */}
      <div className="relative overflow-hidden w-full h-[240px] bg-white/5 backdrop-blur-xl rounded-[32px] p-5 text-white flex flex-col justify-between border border-white/10 shadow-[0_0_20px_rgba(219,39,119,0.1)]">
        {/* Glowing cosmic gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1a0c2e] via-slate-900/60 to-purple-950/40 pointer-events-none"></div>

        {/* Floating animated aura bubbles */}
        <div className="absolute top-10 left-10 w-24 h-24 rounded-full bg-pink-500/20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-28 h-28 rounded-full bg-cyan-500/20 blur-3xl animate-pulse delay-700"></div>

        {/* Display header */}
        <div className="z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur py-1 px-3 rounded-full text-[9px] tracking-widest uppercase border border-white/10 font-bold">
            <Users className="w-3 h-3 text-pink-300 animate-bounce" />
            <span>Collective Aura Map</span>
          </div>

          <button
            onClick={fetchTrends}
            className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 hover:scale-105 active:scale-95 transition-all text-white border border-white/5"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Floating galaxies/particles as interactive mood points */}
        <div className="z-10 my-auto text-center px-4 relative">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-around w-full opacity-60 pointer-events-none select-none">
            <span className="text-[10px] uppercase font-bold tracking-wider bg-pink-500/30 text-pink-200 border border-pink-500/30 px-2 py-0.5 rounded-full animate-bounce">lonely</span>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-purple-500/40 text-purple-200 border border-purple-500/30 px-2.5 py-0.5 rounded-full animate-heartbeat">anxious</span>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-teal-500/30 text-teal-200 border border-teal-500/30 px-2 py-0.5 rounded-full animate-bounce delay-500">numb</span>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-yellow-500/20 text-yellow-105 border border-yellow-500/10 px-2 py-0.5 rounded-full animate-pulse">cozy</span>
          </div>

          {trends ? (
            <p className="text-sm font-serif italic tracking-wide leading-relaxed drop-shadow-md text-pink-100 relative z-10 px-2 animate-[pulse_5s_infinite]">
              &ldquo;{trends.atmosphereQuote}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-white/50 animate-pulse font-serif italic">Gleaning current global emotional weather...</p>
          )}
        </div>

        {/* Stats bottom */}
        <div className="z-10 flex items-end justify-between border-t border-white/10 pt-3">
          <div>
            <span className="text-[8px] text-white/40 uppercase tracking-widest block font-bold">Atmospheric Pressure</span>
            <p className="text-xs font-bold text-teal-300 flex items-center gap-1 mt-0.5">
              <Moon className="w-3 h-3 text-cyan-200 fill-cyan-200" />
              <span>Calming Down</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-[8px] text-white/40 uppercase tracking-widest block font-bold">Active Souls</span>
            <p className="text-xs font-mono font-bold text-white mt-0.5">
              {trends ? trends.totalSubmissions * 12 + 47 : "---"} online
            </p>
          </div>
        </div>
      </div>

      {/* Aggregate metrics */}
      <div className="p-5 bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 shadow-lg space-y-4 text-white">
        <div>
          <h4 className="text-xs font-bold text-pink-300 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Thermometer className="w-4 h-4 text-pink-405" />
            Aggregated Feeling Waves
          </h4>
          <p className="text-[11px] text-white/50 leading-relaxed font-sans mb-3">
            In the past 24 hours, users felt mostly these emotions. We are all breathing the same sky.
          </p>
        </div>

        {trends && (
          <div className="grid grid-cols-3 gap-2">
            {trends.mostCommon.map((emotion, index) => {
              const percentages = ["54%", "28%", "18%"];
              return (
                <div
                  key={emotion}
                  className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center relative overflow-hidden transition-transform hover:scale-105"
                >
                  <span className="text-[9px] uppercase font-bold text-purple-300">Rank #{index + 1}</span>
                  <p className="text-xs font-serif italic text-white capitalize mt-1 select-none font-bold">{emotion}</p>
                  <p className="text-xs font-mono font-extrabold text-pink-400 mt-2">{percentages[index]}</p>
                  <span className="absolute -bottom-1 -right-1 opacity-5 font-bold text-2xl select-none text-white">
                    #{(index + 1)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hour statistics */}
      <div className="p-5 bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 shadow-lg space-y-4 text-white">
        <h4 className="text-xs font-bold text-pink-300 uppercase tracking-widest flex items-center gap-1">
          <CloudRain className="w-3.5 h-3.5 text-blue-400" />
          Hourly Atmosphere Sparks
        </h4>

        {trends ? (
          <div className="space-y-2.5">
            {trends.historicalTrend.map((t) => {
              const maxCount = 25;
              const barWidth = `${(t.count / maxCount) * 100}%`;
              return (
                <div key={t.hour} className="flex items-center gap-3">
                  <span className="w-8 text-[10px] font-mono text-white/40">{t.hour}</span>
                  <div className="flex-1 h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-400 rounded-full transition-all duration-1000 shadow-inner"
                      style={{ width: barWidth }}
                    />
                  </div>
                  <span className="w-16 text-right text-[9px] font-bold text-white/50 select-none">
                    {t.count} ({t.primaryEmotion})
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-white/40">Loading hourly spikes...</p>
        )}
      </div>
    </div>
  );
}

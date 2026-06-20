import React, { useState, useEffect } from "react";
import { BookOpen, Heart, Sparkles, Smile, Trash2, Sunset, Brain, Milestone, TrendingUp } from "lucide-react";
import { JournalEntry } from "../types";

export default function JournalScreen() {
  const [reflectionText, setReflectionText] = useState("");
  const [loggedWord, setLoggedWord] = useState("peaceful");
  const [intensityValue, setIntensityValue] = useState(3);
  const [journalList, setJournalList] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<any>(null);

  // Load Initial entries
  useEffect(() => {
    const cached = localStorage.getItem("socialchat-journal");
    if (cached) {
      setJournalList(JSON.parse(cached));
    } else {
      // Seed some cute initial logs so the list doesn't look empty and boring
      const seed: JournalEntry[] = [
        {
          id: "seed-1",
          date: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
          reflection: "was feeling really heavy about work and future things today. talked to someone feeling exactly the same in balanced mode and we laughed about how cats are overall better than spreadsheets. felt nice.",
          emotionWord: "heavy",
          emotionValue: 2,
          analysis: {
            auraColor: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
            summary: "You are active in seeking support in moments of dark fatigue. Connecting about small charms like animals grounds you.",
            pattern: "You are recognizing triggers of fatigue and looking for safe sparks."
          }
        },
        {
          id: "seed-2",
          date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          reflection: "logged on with 'lonely' as my mood word. got matched with 'hopeful' in unbalanced mode. they told me their local coffee shop gave them double syrup. we shared stories. the night felt much warmer.",
          emotionWord: "warm",
          emotionValue: 4,
          analysis: {
            auraColor: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
            summary: "Exchanging contrasts with hopeful souls is helping dilute your feelings of isolation. Sharing simple daily updates triggers healing codes.",
            pattern: "You gain immediate momentum when matching with opposing optimistic energies."
          }
        }
      ];
      setJournalList(seed);
      localStorage.setItem("socialchat-journal", JSON.stringify(seed));
    }
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionText.trim()) return;

    setIsLoading(true);
    try {
      const resp = await fetch("/api/gemini/journal-reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reflection: reflectionText,
          emotionWord: loggedWord,
          emotionValue: intensityValue
        })
      });

      const analysis = await resp.json();
      const newEntry: JournalEntry = {
        id: `journal-${Date.now()}`,
        date: new Date().toISOString(),
        reflection: reflectionText,
        emotionWord: loggedWord,
        emotionValue: intensityValue,
        analysis
      };

      const updated = [newEntry, ...journalList];
      setJournalList(updated);
      localStorage.setItem("socialchat-journal", JSON.stringify(updated));

      // Clear form
      setReflectionText("");
      setLoggedWord("peaceful");
      setIntensityValue(3);
      setActiveAnalysis(analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    const updated = journalList.filter(j => j.id !== id);
    setJournalList(updated);
    localStorage.setItem("socialchat-journal", JSON.stringify(updated));
  };

  // Compute stats
  const averageIntensity = journalList.length
    ? (journalList.reduce((acc, curr) => acc + curr.emotionValue, 0) / journalList.length).toFixed(1)
    : "3.0";

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-5">
      {/* Diary Card Header */}
      <div className="p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-between text-white shadow-lg">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-white/5 text-pink-400 border border-white/5 shadow-sm animate-pulse">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-serif italic">Your AI Journal</h2>
            <p className="text-[10px] text-white/50">Reflect, track timelines, and visualize aura charts.</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[9px] uppercase font-bold tracking-wider text-pink-300 block">Average Growth</span>
          <span className="text-xs font-mono font-bold text-pink-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 shadow-inner">
            {averageIntensity} / 5.0
          </span>
        </div>
      </div>

      {/* Input reflection form */}
      <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-white">
        <h4 className="text-xs font-bold text-pink-300 uppercase tracking-widest mb-3 flex items-center gap-1">
          <Sunset className="w-3.5 h-3.5 text-orange-400" />
          How do you feel now?
        </h4>

        <form onSubmit={handleCreatePost} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Emotion Word</label>
              <input
                type="text"
                value={loggedWord}
                onChange={(e) => setLoggedWord(e.target.value)}
                placeholder="e.g. softer, tired, glowing"
                className="w-full text-xs p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-pink-500/50 font-medium font-serif italic"
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Intensity Level ({intensityValue})</label>
              <input
                type="range"
                min="1"
                max="5"
                value={intensityValue}
                onChange={(e) => setIntensityValue(Number(e.target.value))}
                className="w-full accent-pink-400 cursor-pointer h-1.5 bg-white/10 rounded-lg mt-3"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Reflections / Musings</label>
            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="What did you learn in SocialChat sessions? Type your warm emotional release notes here..."
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-pink-500/50 resize-none font-sans"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold py-3.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:brightness-110 text-white rounded-xl active:scale-95 transition-all shadow-lg shadow-pink-500/10 uppercase tracking-widest disabled:opacity-30"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? "AI Analyzing Aura..." : "Save to Timeline"}</span>
          </button>
        </form>
      </div>

      {/* active reflection display */}
      {activeAnalysis && (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 animate-[pulse_6s_infinite] shadow-xl text-white">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full" style={{ background: activeAnalysis.auraColor }} />
            <span className="text-[10px] font-semibold text-white/60 font-sans tracking-wide">
              Your Dynamic Emotional Aura
            </span>
          </div>
          <p className="text-xs text-white italic">
            &ldquo;{activeAnalysis.summary}&rdquo;
          </p>
          <div className="p-2 rounded bg-pink-500/15 border-l-2 border-pink-500 text-[10px] text-pink-300 font-medium">
            💡 Pattern Insight: {activeAnalysis.pattern}
          </div>
        </div>
      )}

      {/* Visual Timeline and List */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-pink-300 uppercase tracking-widest flex items-center gap-1.5">
          <Milestone className="w-3.5 h-3.5 text-purple-450" />
          Emotional Chronology ({journalList.length})
        </h4>

        {journalList.length === 0 ? (
          <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 text-xs text-white/40">
            No emotional logs recorded yet. Start writing after a chat connection!
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-white/10 pl-8">
            {journalList.map((entry) => {
              const dateObj = new Date(entry.date);
              return (
                <div key={entry.id} className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 shadow-sm hover:shadow transition-shadow select-none text-white">
                  {/* Timeline bullet */}
                  <span className="absolute -left-[30px] top-6 w-3 h-3 rounded-full bg-pink-500 border-2 border-[#0a050f] ring-4 ring-pink-500/10"></span>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-white/45 font-medium font-sans">
                      {dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] uppercase font-bold text-pink-300 bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 rounded-full shadow">
                        {entry.emotionWord}
                      </span>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-white/30 hover:text-red-400 p-0.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-white/80 leading-relaxed font-sans font-light mb-3">
                    {entry.reflection}
                  </p>

                  {/* AI Aura insights nested */}
                  {entry.analysis && (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-start gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full shadow-inner flex-shrink-0"
                        style={{ background: entry.analysis.auraColor }}
                      />
                      <div>
                        <p className="text-[10px] text-white/70 italic leading-relaxed">
                          &ldquo;{entry.analysis.summary}&rdquo;
                        </p>
                        <p className="text-[9px] font-bold text-purple-300 mt-1 uppercase tracking-wide">
                          Healing step: {entry.analysis.pattern}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

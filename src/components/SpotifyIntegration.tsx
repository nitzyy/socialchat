import { useState } from "react";
import { Music, Search, Heart, Volume2, Pause, Play, Compass } from "lucide-react";
import { Song } from "../types";

// Base aesthetic tracks for automatic selection matching moods
const SUGGESTED_BUILTIN_SONGS: Record<string, Song[]> = {
  sad: [
    { id: "s1", title: "Sweater Weather", artist: "The Neighbourhood", albumArt: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80", energy: "Mellow", tempo: "Slow", mood: "Melancholic" },
    { id: "s2", title: "505", artist: "Arctic Monkeys", albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80", energy: "Drifting", tempo: "Medium", mood: "Nostalgic" },
    { id: "s3", title: "Saturn", artist: "Sleeping At Last", albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80", energy: "Calming", tempo: "Slow", mood: "Etherial" },
  ],
  anxious: [
    { id: "a1", title: "Gilded Lily", artist: "Cults", albumArt: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&auto=format&fit=crop&q=80", energy: "Gentle", tempo: "Slow", mood: "Somatic" },
    { id: "a2", title: "Space Song", artist: "Beach House", albumArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80", energy: "Cosmic", tempo: "Medium", mood: "Dreamy" },
  ],
  happy: [
    { id: "h1", title: "Until I Found You", artist: "Stephen Sanchez", albumArt: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&auto=format&fit=crop&q=80", energy: "Upbeat", tempo: "Medium", mood: "Romantic" },
    { id: "h2", title: "Golden Hour", artist: "JVKE", albumArt: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=300&auto=format&fit=crop&q=80", energy: "Warm", tempo: "Medium", mood: "Radiant" },
  ],
  angry: [
    { id: "an1", title: "Kyoto", artist: "Phoebe Bridgers", albumArt: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=300&auto=format&fit=crop&q=80", energy: "High", tempo: "Fast", mood: "Reflective Anger" },
    { id: "an2", title: "Shut Up My Moms Calling", artist: "Hotel Ugly", albumArt: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&auto=format&fit=crop&q=80", energy: "Moody", tempo: "Slow", mood: "Bittersweet" },
  ],
  default: [
    { id: "d1", title: "Lo-Fi Dreamer", artist: "Chill Beats Co.", albumArt: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80", energy: "Low", tempo: "Chill", mood: "Calm" },
    { id: "d2", title: "Soft Study Sessions", artist: "Café Soundscapes", albumArt: "https://images.unsplash.com/photo-1487180142328-054b783fc471?w=300&auto=format&fit=crop&q=80", energy: "Low", tempo: "Cozy", mood: "Silent" }
  ]
};

interface Props {
  currentEmotion: string;
  selectedSong: Song | null;
  onSelectSong: (song: Song) => void;
  titlePrompt?: string;
}

export default function SpotifyIntegration({ currentEmotion, selectedSong, onSelectSong, titlePrompt }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  // Map user emotion category
  const getEmotionCategory = (emotion: string): string => {
    const e = emotion.toLowerCase().trim();
    if (e.includes("sad") || e.includes("lonely") || e.includes("numb") || e.includes("hurt") || e.includes("cry")) return "sad";
    if (e.includes("anxious") || e.includes("scared") || e.includes("stres") || e.includes("fear") || e.includes("nervous")) return "anxious";
    if (e.includes("happy") || e.includes("excited") || e.includes("good") || e.includes("glad") || e.includes("love")) return "happy";
    if (e.includes("angry") || e.includes("mad") || e.includes("furious") || e.includes("frustr") || e.includes("hate")) return "angry";
    return "default";
  };

  const category = getEmotionCategory(currentEmotion);
  const coreSuggestions = SUGGESTED_BUILTIN_SONGS[category] || SUGGESTED_BUILTIN_SONGS.default;

  // Simulate search filter
  const allSongPool = Object.values(SUGGESTED_BUILTIN_SONGS).flat();
  const displayedSongs = searchQuery.trim()
    ? allSongPool.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : coreSuggestions;

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 animate-pulse">
          <Music className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-serif italic text-white/90 tracking-wide uppercase">
          {titlePrompt || "Spotify Aura Integration"}
        </h4>
      </div>

      <p className="text-[11px] text-white/50 mb-3 font-sans leading-relaxed">
        Let a song radiate your current mood. Matches will view this floating soundtrack instantly.
      </p>

      {/* Input query */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search aesthetic tracks (e.g. 505, Saturn, JVKE)..."
          className="w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-pink-500/50 transition-colors"
        />
        <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3.5" />
      </div>

      {/* Grid of tracks */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {displayedSongs.length === 0 ? (
          <div className="p-4 text-center rounded-xl bg-white/5 border border-white/10 text-xs text-white/40">
            No matching cozy tracks found... Try typing another vibe!
          </div>
        ) : (
          displayedSongs.map((song) => {
            const isSelected = selectedSong?.id === song.id;
            return (
              <button
                key={song.id}
                 onClick={() => {
                  onSelectSong(song);
                  setIsPlaying(true);
                }}
                className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-all duration-300 border ${
                  isSelected
                    ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/40 shadow-md transform scale-[1.01]"
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 group">
                    <img
                      src={song.albumArt}
                      alt={song.title}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex gap-0.5 items-end h-3">
                          <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_delay_100ms] h-2"></span>
                          <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_delay_200ms] h-3"></span>
                          <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_delay_300ms] h-1.5"></span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{song.title}</p>
                    <p className="text-[10px] text-white/55">{song.artist}</p>
                    {song.energy && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 select-none bg-pink-500/15 border border-pink-500/20 text-[8px] text-pink-300 rounded font-medium">
                        {song.energy} · {song.mood}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isSelected ? (
                    <div className="p-1.5 rounded-full bg-pink-500/20 text-pink-300">
                      <Heart className="w-3.5 h-3.5 fill-pink-300" />
                    </div>
                  ) : (
                    <div className="p-1 px-2.5 text-[10px] font-bold text-pink-300 rounded-lg border border-pink-550/35 bg-pink-550/5 hover:bg-pink-550/15 tracking-wide">
                      Attach
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Live widget preview */}
      {selectedSong && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <img
                src={selectedSong.albumArt}
                className="w-8 h-8 rounded-full object-cover animate-[spin_12s_linear_infinite]"
                referrerPolicy="no-referrer"
              />
              <div className="w-2.5 h-2.5 absolute top-2.5 left-2.5 bg-white rounded-full border border-gray-800"></div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <p className="text-[9px] font-semibold text-emerald-400 tracking-wide uppercase">
                  Connected listening
                </p>
              </div>
              <p className="text-xs font-bold text-white">{selectedSong.title}</p>
            </div>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-white/10 border border-white/10 shadow-sm text-emerald-400 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}

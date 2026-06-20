import { useEffect, useState } from "react";
import { Sparkles, Compass, UserCheck, Orbit, Flame, Check } from "lucide-react";
import { ConnectionMode, Song, UserProfile } from "../types";

// Random cutesy online user personas for our simulation deck
const ONLINE_PEER_DECK = [
  { username: "cozy_biscuit", emotion: "lonely", mode: "balanced", song: { id: "s1", title: "Sweater Weather", artist: "The Neighbourhood", albumArt: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80" } },
  { username: "neon_drifter", emotion: "sad", mode: "balanced", song: { id: "s2", title: "505", artist: "Arctic Monkeys", albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80" } },
  { username: "soft_constellation", emotion: "anxious", mode: "balanced", song: { id: "a2", title: "Space Song", artist: "Beach House", albumArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80" } },
  { username: "pancake_sparks", emotion: "happy", mode: "unbalanced", song: { id: "h1", title: "Until I Found You", artist: "Stephen Sanchez", albumArt: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&auto=format&fit=crop&q=80" } },
  { username: "caffeine_dreamer", emotion: "excited", mode: "unbalanced", song: { id: "h2", title: "Golden Hour", artist: "JVKE", albumArt: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=300&auto=format&fit=crop&q=80" } },
  { username: "flicky_matcha", emotion: "tired", mode: "balanced", song: { id: "d1", title: "Lo-Fi Dreamer", artist: "Chill Beats Co.", albumArt: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80" } },
];

interface Props {
  userEmotion: string;
  userMode: ConnectionMode;
  userSong: Song | null;
  onMatchFound: (peer: UserProfile) => void;
  onCancel: () => void;
}

export default function MatchingScreen({ userEmotion, userMode, userSong, onMatchFound, onCancel }: Props) {
  const [matchingStatus, setMatchingStatus] = useState("Broadcasting your emotional code...");
  const [matchWithSimulated, setMatchWithSimulated] = useState(true);

  useEffect(() => {
    // 1. Log our emotion to the server collective queue!
    fetch("/api/collective/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emotion: userEmotion }),
    }).catch(console.error);

    // 2. Set up match loop
    const statusSequence = [
      "Broadcasting your emotional code...",
      "Analyzing atmospheric frequencies...",
      "Searching for your emotional counterweight...",
      "Harmonizing waves...",
      "Unlocking secure tunnel..."
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx = (currentIdx + 1) % statusSequence.length;
      setMatchingStatus(statusSequence[currentIdx]);
    }, 1200);

    const matchDelay = setTimeout(() => {
      if (matchWithSimulated) {
        // Option 1: Solo user match with customized simulated profile
        triggerSimulatedMatch();
      } else {
        // Option 2: Fallback cross-tab matching loop!
        triggerCrossTabMatch();
      }
    }, 4500);

    return () => {
      clearInterval(interval);
      clearTimeout(matchDelay);
    };
  }, [matchWithSimulated, userEmotion, userMode]);

  const triggerSimulatedMatch = () => {
    // Filter matching cards based on balanced / unbalanced intents
    let potentialPeers = [...ONLINE_PEER_DECK];

    if (userMode === "balanced") {
      // Look for similar emotions
      const sameGroup = ONLINE_PEER_DECK.filter((p) => p.emotion === userEmotion);
      if (sameGroup.length > 0) potentialPeers = sameGroup;
    } else {
      // Look for opposing emotions
      const oppositeGroup = ONLINE_PEER_DECK.filter((p) => p.emotion !== userEmotion);
      if (oppositeGroup.length > 0) potentialPeers = oppositeGroup;
    }

    const selectedPeer = potentialPeers[Math.floor(Math.random() * potentialPeers.length)];

    const simulatedMatchedProfile: UserProfile = {
      id: `sim-user-${Date.now()}`,
      username: selectedPeer.username,
      emotion: selectedPeer.emotion,
      mode: selectedPeer.mode as ConnectionMode,
      song: selectedPeer.song,
      spotifyStatus: {
        song: selectedPeer.song.title,
        artist: selectedPeer.song.artist,
        albumArt: selectedPeer.song.albumArt,
        isPlaying: true,
      },
    };

    onMatchFound(simulatedMatchedProfile);
  };

  const triggerCrossTabMatch = () => {
    // Log intent to localStorage for cross-tab coupling
    const myMatchRecord = {
      id: `user-${Date.now()}`,
      username: `soul_wanderer_${Math.floor(Math.random() * 900 + 100)}`,
      emotion: userEmotion,
      mode: userMode,
      song: userSong,
      time: Date.now(),
    };

    localStorage.setItem("socialchat-matching-pulse", JSON.stringify(myMatchRecord));

    // Listen for storage changes mapping target modes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "socialchat-matching-pulse" && e.newValue) {
        const counterMatch = JSON.parse(e.newValue);
        if (counterMatch.id !== myMatchRecord.id) {
          // Verify matching metrics
          const isBalancedMatch =
            userMode === "balanced" &&
            counterMatch.mode === "balanced" &&
            counterMatch.emotion === userEmotion;

          const isUnbalancedMatch =
            userMode === "unbalanced" &&
            counterMatch.mode === "unbalanced" &&
            counterMatch.emotion !== userEmotion;

          if (isBalancedMatch || isUnbalancedMatch) {
            // Unify matched profile
            const crossTabPeer: UserProfile = {
              id: counterMatch.id,
              username: counterMatch.username,
              emotion: counterMatch.emotion,
              mode: counterMatch.mode,
              song: counterMatch.song,
              spotifyStatus: counterMatch.song ? {
                song: counterMatch.song.title,
                artist: counterMatch.song.artist,
                albumArt: counterMatch.song.albumArt,
                isPlaying: true
              } : null
            };
            onMatchFound(crossTabPeer);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Auto simulated fallback after 15s to bypass waiting
    const fallbackTimeout = setTimeout(() => {
      window.removeEventListener("storage", handleStorageChange);
      triggerSimulatedMatch();
    }, 15000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearTimeout(fallbackTimeout);
    };
  };

  return (
    <div className="w-full max-w-sm mx-auto p-6 bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 shadow-xl flex flex-col justify-between items-center text-center py-10 min-h-[460px] text-white">
      
      <div className="space-y-1">
        <span className="text-[10px] uppercase font-bold tracking-widest text-pink-300 bg-pink-500/10 px-3 py-1.5 rounded-full border border-pink-500/20 animate-pulse">
          {userMode === "balanced" ? "Balanced Harmony Active" : "Unbalanced Harmony Active"}
        </span>
        <h2 className="text-2xl font-serif italic text-white mt-3.5">Connecting Frequencies...</h2>
        <p className="text-xs text-white/50 font-sans px-4">
          Searching matching partners who feel {userMode === "balanced" ? "the exact same" : "the opposite"} of you.
        </p>
      </div>

      {/* Pulsing Match Radar Visual */}
      <div className="relative my-8 flex items-center justify-center w-40 h-40">
        {/* Radar Rings */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-pink-500/30 animate-[spin_40s_linear_infinite]" />
        <div className="absolute inset-4 rounded-full border border-purple-500/20 animate-[ping_2s_ease-in-out_infinite]" />
        <div className="absolute inset-8 rounded-full border border-pink-500/10 animate-[pulse_1.5s_infinite]" />
        
        <div className="z-10 p-5 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-[0_0_25px_rgba(219,39,119,0.45)] animate-bounce-slow">
          <Orbit className="w-8 h-8 animate-spin" />
        </div>
      </div>

      {/* Status updates text */}
      <div className="space-y-3 w-full">
        <p className="text-xs font-semibold text-pink-300 animate-pulse">
          {matchingStatus}
        </p>
        
        <div className="text-[10px] text-white/50 py-1.5 bg-black/40 rounded-xl border border-white/5 w-full px-2">
          Waiting coordinates · Your word: <span className="font-serif italic text-pink-400 capitalize">{userEmotion}</span>
        </div>
      </div>

      {/* Interactive config toggle for solo testing */}
      <div className="w-full mt-5 p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
        <div className="text-left">
          <p className="text-[10px] font-bold text-white flex items-center gap-1">
            <Flame className="w-3 h-3 text-pink-400 animate-[bounce_1s_infinite]" />
            Simulation Matching
          </p>
          <p className="text-[8px] text-white/40 mt-0.5">Toggle backup simulated active peers.</p>
        </div>

        <button
          onClick={() => setMatchWithSimulated(!matchWithSimulated)}
          className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-all duration-300 ${
            matchWithSimulated ? "bg-pink-500 justify-end" : "bg-white/10 justify-start"
          }`}
        >
          <span className="w-4 h-4 bg-white rounded-full shadow" />
        </button>
      </div>

      <button
        onClick={onCancel}
        className="mt-6 text-[10px] font-bold text-white/40 hover:text-red-400 underline transition-colors"
      >
        Cancel Matching
      </button>
    </div>
  );
}

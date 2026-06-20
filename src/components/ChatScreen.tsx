import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare, Send, X, AlertTriangle, Shield, Clock, Music,
  Sparkles, Palette, Share2, Instagram, Heart, Play, Users, Moon, ListMusic
} from "lucide-react";
import { ChatMessage, ConnectionMode, Song, UserProfile, StoryCard, HealingPlaylist } from "../types";
import SharedCanvas from "./SharedCanvas";
import MoodStoryCards from "./MoodStoryCards";

interface Props {
  myProfile: UserProfile;
  matchedPeer: UserProfile;
  onQuit: () => void;
  onRestartMatching: () => void;
}

export default function ChatScreen({ myProfile, matchedPeer, onQuit, onRestartMatching }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds (600)
  const [isTimerOver, setIsTimerOver] = useState(false);
  
  // Controls
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showCanvasSheet, setShowCanvasSheet] = useState(false);

  // Social Consensus & End Decisions
  const [myEndDecision, setMyEndDecision] = useState<"stay" | "switch" | null>(null);
  const [peerEndDecision, setPeerEndDecision] = useState<"stay" | "switch" | null>(null);
  const [decisionConcluded, setDecisionConcluded] = useState(false);
  const [socialConsensusUnlocked, setSocialConsensusUnlocked] = useState(false);
  const [myShareConsent, setMyShareConsent] = useState(false);
  const [peerShareConsent, setPeerShareConsent] = useState(false);
  const [igUsernameInput, setIgUsernameInput] = useState("");
  const [mutualIgUnlocked, setMutualIgUnlocked] = useState(false);

  // AI features state
  const [icebreakers, setIcebreakers] = useState<string[]>([
    "if your current feeling was a soft color, what would it be?",
    "what song explains the vibe of today?",
    "what is one little thing that made today bearable?"
  ]);
  const [isLoadingIcebreakers, setIsLoadingIcebreakers] = useState(false);
  
  // Post-chat summaries
  const [activeStoryCard, setActiveStoryCard] = useState<StoryCard | null>(null);
  const [isLoadingStoryCard, setIsLoadingStoryCard] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<HealingPlaylist | null>(null);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);

  // Ref scroll anchors
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatChannelRef = useRef<BroadcastChannel | null>(null);

  // Initial greeting sequence
  useEffect(() => {
    // Register BroadcastChannel for live user dual-messaging
    chatChannelRef.current = new BroadcastChannel(`socialchat-messages-${matchedPeer.id}`);
    chatChannelRef.current.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "new-message") {
        setMessages((prev) => [...prev, payload]);
      } else if (type === "peer-end-decision") {
        setPeerEndDecision(payload);
      } else if (type === "peer-share-consent") {
        setPeerShareConsent(payload);
      }
    };

    // Setup initial greeting messages
    const welcomeMsgs: ChatMessage[] = [
      {
        id: "sys-1",
        senderId: "system",
        senderName: "Healing Bot",
        text: `Successfully matched with ${matchedPeer.username}! You are connecting in ${myProfile.mode} mode.`,
        timestamp: new Date().toISOString()
      },
      {
        id: "sys-2",
        senderId: matchedPeer.id,
        senderName: matchedPeer.username,
        text: `hey... my mood right now is "${matchedPeer.emotion}"...`,
        timestamp: new Date(Date.now() - 1000).toISOString()
      }
    ];

    if (matchedPeer.song) {
      welcomeMsgs.push({
        id: "sys-3",
        senderId: matchedPeer.id,
        senderName: matchedPeer.username,
        text: `listening to "${matchedPeer.song.title}" by "${matchedPeer.song.artist}"... matches the emotional state perfectly`,
        timestamp: new Date().toISOString()
      });
    }

    setMessages(welcomeMsgs);

    return () => {
      chatChannelRef.current?.close();
    };
  }, [matchedPeer]);

  // 10-minutes clock timer loop
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsTimerOver(true);
      // Automatically pop partner decision modal
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Auto scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle manual message inputs
  const handleSendMessage = async (textToSend?: string) => {
    const rawVal = textToSend || inputText;
    if (!rawVal.trim()) return;

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: myProfile.id,
      senderName: myProfile.username,
      text: rawVal.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Broadcast messages across other open browser tabs
    chatChannelRef.current?.postMessage({
      type: "new-message",
      payload: newMsg
    });

    // Also trigger simulated response from matched Peer in case user is in solo mode
    if (matchedPeer.id.startsWith("sim-user-")) {
      simulatePeerResponse([...messages, newMsg]);
    }
  };

  // Simulate emotional dialogue of online partner using Gemini route
  const simulatePeerResponse = async (convoHistory: ChatMessage[]) => {
    // Provide nice typing delays to look human!
    setTimeout(async () => {
      try {
        const response = await fetch("/api/gemini/peer-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: convoHistory.filter(m => m.senderId !== "system"),
            peerName: matchedPeer.username,
            peerEmotion: matchedPeer.emotion,
            peerMode: myProfile.mode,
            peerSong: matchedPeer.song
          })
        });
        const reply = await response.json();
        const peerMsg: ChatMessage = {
          id: `m-peer-${Date.now()}`,
          senderId: matchedPeer.id,
          senderName: matchedPeer.username,
          text: reply.text,
          timestamp: new Date().toISOString()
        };

        setMessages((prev) => [...prev, peerMsg]);

        // Sync back on broadcast channel so multi-tab tests reflect logs
        chatChannelRef.current?.postMessage({
          type: "new-message",
          payload: peerMsg
        });
      } catch (err) {
        console.error("Peer dialogue error:", err);
      }
    }, 2500); // 2.5s natural delay
  };

  // Trigger customized AI Icebreaker queries
  const fetchCustomIcebreakers = async () => {
    setIsLoadingIcebreakers(true);
    try {
      const response = await fetch("/api/gemini/icebreaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emotionOne: myProfile.emotion,
          emotionTwo: matchedPeer.emotion,
          messages: messages.filter(m => m.senderId !== "system")
        })
      });
      const data = await response.json();
      if (data.icebreakers && Array.isArray(data.icebreakers)) {
        setIcebreakers(data.icebreakers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingIcebreakers(false);
    }
  };

  // Trigger AI Post-Chat Story Souvenirs
  const buildStoryCard = async () => {
    setIsLoadingStoryCard(true);
    try {
      const response = await fetch("/api/gemini/story-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.filter(m => m.senderId !== "system"),
          emotionOne: myProfile.emotion,
          emotionTwo: matchedPeer.emotion
        })
      });
      const data = await response.json();
      setActiveStoryCard({
        id: `card-${Date.now()}`,
        quote: data.quote,
        subquote: data.subquote,
        theme: data.theme,
        date: new Date().toISOString(),
        chatEmotionOne: myProfile.emotion,
        chatEmotionTwo: matchedPeer.emotion
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStoryCard(false);
    }
  };

  // Trigger AI Playlist builders
  const buildPlaylist = async () => {
    setIsLoadingPlaylist(true);
    try {
      const response = await fetch("/api/gemini/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.filter(m => m.senderId !== "system"),
          emotionOne: myProfile.emotion,
          emotionTwo: matchedPeer.emotion
        })
      });
      const data = await response.json();
      setActivePlaylist(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPlaylist(false);
    }
  };

  // Submit Evaluation Options (Switch vs Stay)
  const submitEndDecision = (decision: "stay" | "switch") => {
    setMyEndDecision(decision);

    // Broadcast our decision
    chatChannelRef.current?.postMessage({
      type: "peer-end-decision",
      payload: decision
    });

    // Solve for partner's response based on sandbox mode
    if (matchedPeer.id.startsWith("sim-user-")) {
      // simulated user answers stays 80% of times to make interaction super joyful!
      setTimeout(() => {
        const simDecision = Math.random() < 0.85 ? "stay" : "switch";
        setPeerEndDecision(simDecision);
      }, 1500);
    }
  };

  // Evaluate final Consensus logic:
  // - if BOTH STAY: add each other, unlock social sharing options!
  // - if anyone SWITCHES: restarts matchmaking
  useEffect(() => {
    if (myEndDecision && peerEndDecision) {
      setDecisionConcluded(true);

      if (myEndDecision === "stay" && peerEndDecision === "stay") {
        setSocialConsensusUnlocked(true);
      } else {
        // Someone wanted to switch -> Auto restart match phase after a notification delay
        setSocialConsensusUnlocked(false);
      }
    }
  }, [myEndDecision, peerEndDecision]);

  // Share social username triggers
  const submitShareConsent = () => {
    setMyShareConsent(true);
    chatChannelRef.current?.postMessage({
      type: "peer-share-consent",
      payload: true
    });

    if (matchedPeer.id.startsWith("sim-user-")) {
      setTimeout(() => {
        setPeerShareConsent(true);
      }, 1000);
    }
  };

  useEffect(() => {
    if (myShareConsent && peerShareConsent) {
      setMutualIgUnlocked(true);
    }
  }, [myShareConsent, peerShareConsent]);

  // Quick report mechanism
  const submitReport = () => {
    if (!reportReason) return;
    setReportSuccess(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSuccess(false);
      onQuit();
    }, 2500);
  };

  // Format digital timers
  const formatTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#0d0714]/80 backdrop-blur-2xl rounded-[40px] border border-white/10 shadow-2xl flex flex-col h-[680px] overflow-hidden relative font-sans text-white">
      
      {/* 1. Header with details and live miniplayer */}
      <div className="bg-[#0f0a1c]/90 border-b border-white/15 p-4 pb-3 z-10 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              {/* Spinning avatar record */}
              <div className="w-10 h-10 rounded-full border-2 border-pink-500/40 overflow-hidden shadow-inner bg-gradient-to-tr from-pink-500/10 to-indigo-500/10 flex items-center justify-center">
                <span className="text-xl select-none">🌸</span>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#0d0714] rounded-full"></span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{matchedPeer.username}</span>
                <span className="text-[9px] uppercase font-bold text-pink-300 bg-pink-500/20 border border-pink-500/20 px-2 rounded-full">
                  {matchedPeer.emotion}
                </span>
              </div>
              <p className="text-[9px] text-white/50 font-sans tracking-wide">
                10-min therapeutic solidarity session
              </p>
            </div>
          </div>

          {/* Clock controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-full bg-pink-500/15 border border-pink-500/20 text-pink-350">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span className="text-xs font-mono font-extrabold tracking-tight">
                {formatTime(timeLeft)}
              </span>
            </div>

            <button
              onClick={() => setShowQuitConfirm(true)}
              className="p-1.5 text-white/40 hover:text-red-400 rounded-lg transition-colors hover:bg-white/5"
              title="Quit Connection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Spotify card snippet displaying currently listening track */}
        {matchedPeer.spotifyStatus && (
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-2xl">
            <div className="flex items-center gap-2">
              <img
                src={matchedPeer.spotifyStatus.albumArt}
                alt="album"
                className="w-7 h-7 rounded-lg object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="leading-none">
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-emerald-400 block">
                  Currently playing
                </span>
                <span className="text-[10px] font-bold text-white">
                  {matchedPeer.spotifyStatus.song}
                </span>
                <span className="text-[9px] text-white/55 block">
                  {matchedPeer.spotifyStatus.artist}
                </span>
              </div>
            </div>

            {/* Simulated Live wave */}
            <div className="flex gap-0.5 items-end h-3 pr-2 select-none">
              <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_delay_100ms] h-2"></span>
              <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_delay_200ms] h-3"></span>
              <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_delay_300ms] h-1.5"></span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Messages Board */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col bg-[radial-gradient(rgba(244,63,94,0.06)_0.5px,_transparent_0.5px)] [background-size:16px_16px]">
        {messages.map((m) => {
          const isMe = m.senderId === myProfile.id;
          const isSys = m.senderId === "system";

          if (isSys) {
            return (
              <div key={m.id} className="text-center my-1 select-none">
                <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/5 text-[10px] font-medium text-white/50 tracking-wide">
                  {m.text}
                </span>
              </div>
            );
          }

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col max-w-[80%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-bold text-white/40 capitalize">{m.senderName}</span>
                <span className="text-[8px] text-white/30">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div
                className={`py-3 px-4 rounded-3xl text-xs font-semibold tracking-wide shadow-md font-sans ${
                  isMe
                    ? "bg-gradient-to-tr from-pink-500 to-purple-600 text-white rounded-tr-none border border-pink-500/20"
                    : "bg-white/5 border border-white/10 text-white/95 rounded-tl-none leading-relaxed"
                }`}
              >
                {m.text}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Sliding Drawing Sheet (Shared Canvas Drawer) */}
      <AnimatePresence>
        {showCanvasSheet && (
          <motion.div
            initial={{ opacity: 0, y: 300 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 300 }}
            className="absolute bottom-0 inset-x-0 bg-[#0d0714]/95 backdrop-blur-md z-30 p-4 border-t-2 border-pink-500/30 rounded-t-[32px] shadow-2xl flex flex-col gap-2 text-white"
          >
            <div className="flex items-center justify-between border-b pb-2 mb-2 border-white/10">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-serif italic">
                <Palette className="w-4 h-4 text-pink-400" />
                Collaborative Emotional Doodleboard
              </h4>
              <button
                onClick={() => setShowCanvasSheet(false)}
                className="p-1 hover:bg-white/10 rounded-full"
                title="Minimize Canvas"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            <SharedCanvas roomId={matchedPeer.id} senderId={myProfile.id} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Active Bottom Bar with Icebreakers & Canvas buttons */}
      <div className="p-3 bg-[#0f0a1c]/95 border-t border-white/10 flex flex-col gap-2 z-10 shadow-lg text-white">
        {/* Icebreaker promps */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none scrollbar-none pr-3">
          <button
            onClick={fetchCustomIcebreakers}
            disabled={isLoadingIcebreakers}
            className="flex-shrink-0 flex items-center gap-1 text-[9px] font-extrabold bg-gradient-to-r from-pink-500 to-purple-600 text-white p-1 px-2.5 rounded-full shadow hover:scale-105 active:scale-95 transition-transform border border-pink-500/30"
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>AI Prompter</span>
          </button>

          {icebreakers.map((starter) => (
            <button
              key={starter}
              onClick={() => handleSendMessage(starter)}
              className="flex-shrink-0 text-[10px] text-white/70 bg-white/5 hover:bg-pink-500/20 hover:text-pink-300 border border-white/5 px-3 py-1 rounded-full transition-colors font-medium cursor-pointer"
            >
              "{starter}"
            </button>
          ))}
        </div>

        {/* Messaging triggers and palette triggers */}
        <div className="flex items-center gap-2">
          {/* Palette trigger */}
          <button
            onClick={() => setShowCanvasSheet(!showCanvasSheet)}
            className={`p-3 rounded-full border transition-all hover:scale-105 active:scale-95 ${
              showCanvasSheet
                ? "bg-pink-500/20 border-pink-500 text-pink-300"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white/80 shadow-sm"
            }`}
            title="Doodle together"
          >
            <Palette className="w-4 h-4 animate-bounce-slow" />
          </button>

          <input
            type="text"
            disabled={isTimerOver}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={isTimerOver ? "Conversation summary gate open..." : "Type deep, gentle thoughts here..."}
            className="flex-1 font-sans text-xs py-3 px-4 rounded-full border border-white/10 bg-white/5 focus:outline-none focus:ring-1 focus:ring-pink-500/50 text-white placeholder-white/30"
          />

          <button
            disabled={!inputText.trim()}
            onClick={() => handleSendMessage()}
            className="p-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90 disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform shadow border border-pink-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-white/45 mt-1 px-1">
          <button
            onClick={() => setShowReportModal(true)}
            className="hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Report conversation</span>
          </button>

          <span className="font-mono">{95 + Math.floor(Math.random() * 5)}% connection stability</span>
        </div>
      </div>

      {/* QUIT CONFIRM MODAL */}
      <AnimatePresence>
        {showQuitConfirm && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 bg-black/40">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#120a1d] border border-white/10 p-5 rounded-3xl shadow-xl w-full max-w-xs text-center space-y-4"
            >
              <h3 className="text-sm font-bold text-white font-serif italic">Disconnect Session?</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                You will close this gentle therapeutic connection anonymously and return to the main hub. Are you comfortable leaving now?
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowQuitConfirm(false)}
                  className="flex-1 py-2 text-xs font-bold text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                >
                  Stay Cozy
                </button>
                <button
                  onClick={() => {
                    setShowQuitConfirm(false);
                    onQuit();
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-red-650 hover:bg-red-600 rounded-xl transition-all"
                >
                  Disconnect
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REPORT PERSON MODAL */}
      <AnimatePresence>
        {showReportModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#120a1d] border border-white/10 p-5 rounded-3xl shadow-xl w-full max-w-xs space-y-4 text-white"
            >
              <h3 className="text-sm font-bold text-white text-center flex items-center justify-center gap-1 font-serif italic">
                <Shield className="w-4 h-4 text-red-400" />
                Safety Report Logging
              </h3>
              
              <p className="text-[11px] text-white/50 text-center leading-relaxed font-sans">
                SocialChat enforces absolute kind and comforting guidelines. Flag any misconduct or hostile behaviors immediately.
              </p>

              {reportSuccess ? (
                <div className="py-4 text-center text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  Report submitted. Closing chat safely...
                </div>
              ) : (
                <div className="space-y-3">
                  <select
                     value={reportReason}
                     onChange={(e) => setReportReason(e.target.value)}
                     className="w-full text-xs p-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                  >
                    <option value="" className="bg-[#120a1d]">-- Choose warning flags --</option>
                    <option value="abuse" className="bg-[#120a1d]">Hostile / Angry language</option>
                    <option value="spam" className="bg-[#120a1d]">Commercial advertisement</option>
                    <option value="unsafe" className="bg-[#120a1d]">Unsolicited oversharing</option>
                  </select>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="flex-1 py-2 text-xs font-semibold text-white/50 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl"
                    >
                      Bypass
                    </button>
                    <button
                      onClick={submitReport}
                      className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
                      disabled={!reportReason}
                    >
                      Submit Report
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* END OF TIMER GATES / SUMMARY PORTAL POPUP */}
      <AnimatePresence>
        {isTimerOver && (
          <div className="absolute inset-0 bg-[#0c0615]/95 backdrop-blur z-40 overflow-y-auto p-6 space-y-5 flex flex-col justify-between text-white border-white/5">
            <div className="space-y-4 text-center pt-6">
              <span className="inline-flex p-3 rounded-full bg-pink-500/20 text-pink-300 animate-pulse border border-pink-500/30">
                <Clock className="w-6 h-6" />
              </span>
              <h3 className="text-lg font-bold font-serif italic text-white leading-tight">15-Minute Session Epilogue</h3>
              <p className="text-xs text-white/50 leading-relaxed px-2">
                Your therapeutic window has gently closed. Would you like to stay and add each other, or switch partnerships to seek fresh emotional weather?
              </p>
            </div>

            {/* Decisions grid selectors */}
            <div className="space-y-3">
              {!myEndDecision ? (
                <div className="flex gap-2.5">
                  <button
                    onClick={() => submitEndDecision("switch")}
                    className="flex-1 py-3 border border-white/10 text-xs font-bold text-white bg-white/5 rounded-xl hover:scale-105 active:scale-95 transition-all text-center leading-normal"
                  >
                    Switch partnerships
                  </button>

                  <button
                    onClick={() => submitEndDecision("stay")}
                    className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md text-center leading-normal border border-pink-500/20"
                  >
                    Stay & connect deeper
                  </button>
                </div>
              ) : (
                <div className="py-4 bg-white/5 border border-white/10 rounded-2xl text-center text-xs font-semibold text-white/80 animate-pulse space-y-1">
                  <p>You chose to <span className="text-pink-300 uppercase font-bold">{myEndDecision}</span></p>
                  {peerEndDecision ? (
                    <p className="text-[10px] text-white/50">Partner decided to: <span className="uppercase text-purple-300 font-serif italic font-semibold">{peerEndDecision}</span></p>
                  ) : (
                    <p className="text-[10px] text-white/40">Waiting for partner's frequency...</p>
                  )}
                </div>
              )}

              {/* MUTUAL TRUST CONSCENSUS OR REDIRECT NOTIFS */}
              {decisionConcluded && (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center backdrop-blur-md">
                  {!socialConsensusUnlocked ? (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-red-400 font-serif italic">Unmatched intentions</p>
                      <p className="text-[10px] text-white/50 px-2 leading-relaxed">
                        Since one or both chose to switch, we are opening matching channels again automatically. Thank you for this beautiful window!
                      </p>
                      <button
                        onClick={onRestartMatching}
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow hover:brightness-110 tracking-widest uppercase font-serif"
                      >
                        Begin New Match
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="inline-flex p-2.5 rounded-full bg-pink-500/20 text-pink-300 animate-bounce border border-pink-500/30">
                        <Heart className="w-5 h-5 fill-pink-300" />
                      </div>
                      <h4 className="text-sm font-bold text-white font-serif italic leading-none">Mutual Trust Unlocked!</h4>
                      <p className="text-[10px] text-white/50 max-w-xs mx-auto leading-relaxed">
                        Both agreed to Stay! You can connect further by linking socials securely and building journals together.
                      </p>

                      {/* Instagram popup modal layout */}
                      {!mutualIgUnlocked ? (
                        <div className="space-y-3 p-3.5 bg-white/5 border border-white/10 rounded-xl text-left">
                          <label className="text-[9px] uppercase font-bold text-pink-300 tracking-wider block">
                            Instagram Profile Linking (Optional)
                          </label>
                          <input
                            type="text"
                            value={igUsernameInput}
                            onChange={(e) => setIgUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ""))}
                            placeholder="Type @username to unlock..."
                            className="w-full text-xs p-2.5 rounded-lg border border-white/10 bg-[#0d0714]/40 text-white focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                          />

                          <div className="flex gap-2">
                            <button
                              onClick={submitShareConsent}
                              disabled={!igUsernameInput}
                              className="flex-1 text-center py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-bold rounded-lg disabled:opacity-30 uppercase tracking-wider"
                            >
                              Share Handle
                            </button>
                          </div>
                          <span className="text-[8px] text-white/40 leading-normal block italic pr-2">
                            ⚠️ Handles will be visible ONLY after both of you click Share. You can revoke connections anytime.
                          </span>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          className="p-4 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-2xl border border-pink-500/20 text-center space-y-3"
                        >
                          <Sparkles className="w-6 h-6 text-pink-300 mx-auto animate-spin-slow" />
                          <p className="text-xs font-bold text-white">Profiles Connected!</p>
                          <div className="p-2 py-3 bg-white/5 border border-white/15 inline-block font-mono text-xs font-extrabold text-pink-300 rounded-xl shadow-lg">
                            IG Handle: @{igUsernameInput || "cozy_healer"}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI post-conversaiton story souvenirs and playlists */}
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-4 space-y-3 backdrop-blur-md">
              <h4 className="text-xs font-bold text-pink-300 flex items-center gap-1 justify-center uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-pink-305" />
                AI Post-Chat Artifacts
              </h4>

              <div className="flex gap-2">
                <button
                  onClick={buildStoryCard}
                  disabled={isLoadingStoryCard}
                  className="flex-1 py-2 px-3 text-[10px] font-bold bg-pink-500/10 text-pink-300 border border-pink-500/20 rounded-xl flex items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-all text-center"
                >
                  <Share2 className="w-3 h-3" />
                  <span>{isLoadingStoryCard ? "Rendering Story..." : "Story Card"}</span>
                </button>

                <button
                  onClick={buildPlaylist}
                  disabled={isLoadingPlaylist}
                  className="flex-1 py-2 px-3 text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-xl flex items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-all text-center"
                >
                  <ListMusic className="w-3 h-3" />
                  <span>{isLoadingPlaylist ? "Symphonizing..." : "Healing Playlist"}</span>
                </button>
              </div>

              {/* STORY CARD INLINE WINDOW */}
              {activeStoryCard && (
                <div className="border border-dashed border-white/10 p-2 text-center rounded-2xl bg-white/5 shadow-inner">
                  <MoodStoryCards card={activeStoryCard} />
                </div>
              )}

              {/* HEALING PLAYLIST INLINE WINDOW */}
              {activePlaylist && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0f0a1c]/85 border p-4 rounded-2xl border-white/10 space-y-3 text-white"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-2 pb-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[9px] font-bold rounded-lg relative">
                      {activePlaylist.category} Playlist
                    </div>
                    <h5 className="text-xs font-bold text-white font-serif italic">{activePlaylist.title}</h5>
                  </div>
                  <p className="text-[10px] text-white/50 leading-relaxed font-sans">{activePlaylist.description}</p>

                  <div className="space-y-1.5 pt-2">
                    {activePlaylist.songs.map((s) => (
                      <div key={s.id} className="p-1.5 px-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={s.albumArt || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop"}
                            className="w-7 h-7 rounded-lg object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="text-left">
                            <p className="text-[10px] font-bold text-white">{s.title}</p>
                            <p className="text-[8px] text-white/50">{s.artist}</p>
                          </div>
                        </div>

                        <button className="p-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/35">
                          <Play className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <span className="text-[8px] italic text-white/40 leading-normal block">
                    🎁 Ready for Spotify export! Connect your Spotify and sync this soothing collection.
                  </span>
                </motion.div>
              )}
            </div>

            <button
              onClick={onQuit}
              className="w-full text-center text-[10px] font-semibold text-white/40 hover:text-white/70 hover:scale-105 active:scale-95 transition-all underline py-2 pt-4"
            >
              Back to Main Hub
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

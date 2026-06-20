import React, { useState, useEffect } from "react";
import {
  Sparkles, Heart, Compass, BookOpen, Users, Smartphone,
  Wifi, Battery, Signal, UserPlus, Info, Mail, Lock, User,
  Key, LogOut, Search, Trash2, ShieldAlert, RefreshCw, X, Eye, EyeOff, UserCheck
} from "lucide-react";
import { ConnectionMode, Song, UserProfile } from "./types";
import EmotionInputScreen from "./components/EmotionInputScreen";
import MatchingScreen from "./components/MatchingScreen";
import ChatScreen from "./components/ChatScreen";
import JournalScreen from "./components/JournalScreen";
import CollectiveEmotionScreen from "./components/CollectiveEmotionScreen";

export default function App() {
  const [activeTab, setActiveTab] = useState<"match" | "journal" | "collective">("match");
  
  // Onboarding username steps
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [username, setUsername] = useState("");

  // Connected Flow state triggers
  const [flowState, setFlowState] = useState<"onboarding" | "input" | "radar" | "chat">("onboarding");
  const [userEmotion, setUserEmotion] = useState("");
  const [userMode, setUserMode] = useState<ConnectionMode>("balanced");
  const [userSong, setUserSong] = useState<Song | null>(null);
  const [matchedPeer, setMatchedPeer] = useState<UserProfile | null>(null);

  // My permanent Profile
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);

  // Live timer for Mock Mobile top bar
  const [localTime, setLocalTime] = useState("");

  // Authenticated database user states
  const [currentUser, setCurrentUser] = useState<{ email: string; username: string; joinedAt: number } | null>(null);
  const [authView, setAuthView] = useState<"signin" | "signup" | "verify" | "recovery_request" | "recovery_reset">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCodeInput, setVerificationCodeInput] = useState("");
  const [recoveryCodeInput, setRecoveryCodeInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccessMsg, setAuthSuccessMsg] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Simulated Inbox state
  const [showSimulatedInbox, setShowSimulatedInbox] = useState(false);
  const [simulatedEmailsList, setSimulatedEmailsList] = useState<any[]>([]);

  // Admin panel state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  useEffect(() => {
    // Sync active clock
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // conversion of Hour 0
      setLocalTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Poll simulated logs of emails sent by the backend
  const fetchSimulatedEmails = async () => {
    try {
      const res = await fetch("/api/auth/simulated-emails");
      if (res.ok) {
        const data = await res.json();
        setSimulatedEmailsList(data);
      }
    } catch (e) {
      console.error("Error reading simulated emails:", e);
    }
  };

  useEffect(() => {
    fetchSimulatedEmails();
    const interval = setInterval(fetchSimulatedEmails, 3000);
    return () => clearInterval(interval);
  }, []);

  // Hydrate cached session
  useEffect(() => {
    const cachedSessionStr = localStorage.getItem("socialchat-session");
    if (cachedSessionStr) {
      try {
        const session = JSON.parse(cachedSessionStr);
        setCurrentUser(session);
        setUsername(session.username);
        setIsOnboarded(true);
        setFlowState("input");
        setMyProfile({
          id: `me-${Date.now()}`,
          username: session.username,
          emotion: "",
          mode: "balanced",
          song: null,
          spotifyStatus: null
        });
      } catch (e) {
        localStorage.removeItem("socialchat-session");
      }
    }
  }, []);

  // Handle Submit Registration Action
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccessMsg("");
    if (!authUsername.trim()) {
      setAuthError("Nickname is required");
      return;
    }
    setIsAuthLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          username: authUsername,
          password: authPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign up");
      }
      setAuthSuccessMsg("Verficiation code has been dispatched to your Inbox!");
      setAuthView("verify");
      fetchSimulatedEmails();
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Verify Action 6-digit Code
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccessMsg("");
    if (!verificationCodeInput.trim() || verificationCodeInput.length < 6) {
      setAuthError("Please input a valid 6-digit session key");
      return;
    }
    setIsAuthLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          code: verificationCodeInput
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Confirmation failed");
      }
      
      // Update states
      localStorage.setItem("socialchat-session", JSON.stringify(data.user));
      setCurrentUser(data.user);
      setUsername(data.user.username);
      setIsOnboarded(true);
      setFlowState("input");

      setMyProfile({
        id: `me-${Date.now()}`,
        username: data.user.username,
        emotion: "",
        mode: "balanced",
        song: null,
        spotifyStatus: null
      });
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Login Signin Action
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccessMsg("");
    setIsAuthLoading(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.unverified) {
          // Send to verification
          setAuthEmail(data.email);
          setAuthUsername(data.username);
          setAuthView("verify");
          setAuthSuccessMsg(data.error);
          fetchSimulatedEmails();
          return;
        }
        throw new Error(data.error || "Sign in failed");
      }

      // Login success
      localStorage.setItem("socialchat-session", JSON.stringify(data.user));
      setCurrentUser(data.user);
      setUsername(data.user.username);
      setIsOnboarded(true);
      setFlowState("input");

      setMyProfile({
        id: `me-${Date.now()}`,
        username: data.user.username,
        emotion: "",
        mode: "balanced",
        song: null,
        spotifyStatus: null
      });
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Forgot Password Verification Trigger
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccessMsg("");
    if (!authEmail.trim()) {
      setAuthError("Email is required");
      return;
    }
    setIsAuthLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to reset password");
      }
      setAuthSuccessMsg("Dispatched password reset token. Check Simulated Inbox!");
      setAuthView("recovery_reset");
      fetchSimulatedEmails();
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Reset Password with Recovery 6-digit Code
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccessMsg("");
    if (!recoveryCodeInput.trim() || !newPasswordInput.trim()) {
      setAuthError("Please complete all requested recovery parameters");
      return;
    }
    setIsAuthLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          code: recoveryCodeInput,
          newPassword: newPasswordInput
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Password reset failed");
      }

      // Save session
      localStorage.setItem("socialchat-session", JSON.stringify(data.user));
      setCurrentUser(data.user);
      setUsername(data.user.username);
      setIsOnboarded(true);
      setFlowState("input");

      setMyProfile({
        id: `me-${Date.now()}`,
        username: data.user.username,
        emotion: "",
        mode: "balanced",
        song: null,
        spotifyStatus: null
      });
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Logout session Action
  const handleLogout = () => {
    localStorage.removeItem("socialchat-session");
    setCurrentUser(null);
    setIsOnboarded(false);
    setFlowState("onboarding");
    setAuthView("signin");
    setAuthEmail("");
    setAuthUsername("");
    setAuthPassword("");
    setVerificationCodeInput("");
    setRecoveryCodeInput("");
    setNewPasswordInput("");
  };

  // Fetch admin stats
  const fetchAdminStats = async () => {
    if (!currentUser || currentUser.email !== "gnitya2507@gmail.com") return;
    setIsAdminLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?adminEmail=${encodeURIComponent(currentUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        setAdminStats(data);
      }
    } catch (e) {
      console.error("Admin statistics retrieval failed:", e);
    } finally {
      setIsAdminLoading(false);
    }
  };

  // Trigger loading stats when admin panel is clicked
  useEffect(() => {
    if (showAdminPanel) {
      fetchAdminStats();
    }
  }, [showAdminPanel]);

  // Admin delete/revoke user account
  const handleDeleteUser = async (emailToDelete: string) => {
    if (!currentUser || currentUser.email !== "gnitya2507@gmail.com") return;
    if (emailToDelete === "gnitya2507@gmail.com") {
      alert("You cannot self-delete the supreme admin account!");
      return;
    }
    if (!confirm(`Are you absolutely sure you want to revoke registered aura for ${emailToDelete}?`)) return;

    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: currentUser.email,
          emailToDelete
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      fetchAdminStats();
    } catch (err: any) {
      alert("Removal action failed: " + err.message);
    }
  };

  // Switch to radar matchmaking stage
  const handleBeginMatch = (emotion: string, mode: ConnectionMode, song: Song | null) => {
    setUserEmotion(emotion);
    setUserMode(mode);
    setUserSong(song);

    if (myProfile) {
      const updated = { ...myProfile, emotion, mode, song };
      setMyProfile(updated);
    }

    setFlowState("radar");
  };

  // Match found trigger
  const handleMatchFound = (peer: UserProfile) => {
    setMatchedPeer(peer);
    setFlowState("chat");
  };

  // Clear matched user chat states cleanly
  const handleCloseChat = () => {
    setMatchedPeer(null);
    setFlowState("input");
    setActiveTab("match");
  };

  const handleRestartMatching = () => {
    setMatchedPeer(null);
    setFlowState("radar");
  };

  // Dynamic emotional background color shifter mapping emotions to cutesy gradients
  const getGlobalSceneColors = () => {
    if (flowState === "chat" && matchedPeer) {
      const e = matchedPeer.emotion.toLowerCase();
      if (e.includes("sad") || e.includes("lonely") || e.includes("numb")) {
        return "bg-gradient-to-tr from-slate-100 via-indigo-50/50 to-blue-50/70";
      }
      if (e.includes("happy") || e.includes("excited")) {
        return "bg-gradient-to-tr from-pink-50 via-yellow-50 to-orange-50/60";
      }
      if (e.includes("anxious") || e.includes("scared")) {
        return "bg-gradient-to-tr from-purple-100/50 via-pink-50 to-emerald-[50]/10";
      }
    }

    switch (activeTab) {
      case "journal":
        return "bg-gradient-to-tr from-purple-50 via-indigo-50/30 to-purple-100/50";
      case "collective":
        return "bg-indigo-950/5";
      default:
        return "bg-gradient-to-tr from-pink-100/30 via-purple-50 to-teal-50/25";
    }
  };

  return (
    <div 
      style={{ 
        background: "radial-gradient(circle at 10% 10%, #2e1065 0%, transparent 60%), radial-gradient(circle at 90% 90%, #831843 0%, transparent 60%), #0a050f" 
      }} 
      className="min-h-screen w-full flex items-center justify-center p-0 md:p-8 transition-colors duration-1000 select-none font-sans text-white overflow-hidden relative"
    >
      
      {/* Immersive background decoration aura bubbles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-700/10 blur-[130px] pointer-events-none animate-slow-pulse-1"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-pink-700/10 blur-[150px] pointer-events-none animate-slow-pulse-2"></div>

      {/* Decorative Outer ambient float cards for Desktop aesthetics */}
      <div className="absolute top-10 left-10 hidden xl:flex flex-col gap-2.5 max-w-xs p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-[0_0_30px_rgba(219,39,119,0.1)] z-0 text-white">
        <div className="flex items-center gap-2">
          <div className="p-1 px-1.5 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 shadow-[0_0_15px_rgba(219,39,119,0.5)]">
            <Heart className="w-4 h-4 text-white fill-current animate-pulse" />
          </div>
          <h2 className="text-xl font-serif italic tracking-tight text-white">What is SocialChat?</h2>
        </div>
        <p className="text-xs text-white/70 leading-relaxed font-sans font-light">
          We believe standard social networks are exhausting. Instead of mapping you by interests, we couple your temporary feelings to therapeutic dialog partners.
        </p>
        <span className="text-[10px] text-pink-400 font-extrabold uppercase tracking-widest mt-1">
          Anonymity-First · Safe Haven
        </span>
      </div>

      <div className="absolute bottom-10 right-10 hidden xl:flex flex-col gap-2.5 max-w-xs p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-[0_0_30px_rgba(139,92,246,0.1)] z-0 text-white">
        <h4 className="text-xs font-bold text-pink-300 uppercase tracking-widest flex items-center gap-1.5">
          <Info className="w-4 h-4 text-purple-400" />
          Multi-User Interactive Testing
        </h4>
        <p className="text-[11px] text-white/70 leading-relaxed">
          Open multiple browser windows or tabs of SocialChat right on this device. Input conflicting feelings (e.g. happy vs sad) and explore live synced paintings and sharing!
        </p>
      </div>

      {/* CORE DEVICE CONTAINER BOX FRAME */}
      <div className="relative w-full max-w-md h-full md:h-[740px] bg-[#12081d]/85 md:p-4 rounded-none md:rounded-[48px] shadow-[0_0_50px_rgba(219,39,119,0.15)] flex flex-col overflow-hidden z-10 border border-white/10 md:border-4 md:border-zinc-850">
        
        {/* Mock Top Notch & Camera cutout on mobile frame viewports */}
        <div className="hidden md:flex absolute top-5 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-40 items-center justify-center p-1 border border-white/5">
          <div className="w-3.5 h-3.5 bg-zinc-900 rounded-full border border-zinc-800 absolute right-4"></div>
          <span className="w-1.5 h-1.5 bg-purple-900 rounded-full mr-12 animate-pulse"></span>
        </div>

        {/* Dynamic Mobile Status Information Bar */}
        <div className="bg-black/30 backdrop-blur-lg px-6 py-3 flex justify-between items-center text-white/80 font-sans text-[10px] font-bold tracking-widest z-30 select-none border-b border-white/5 md:mt-3 rounded-none md:rounded-t-[32px]">
          <span className="font-mono">{localTime || "10:10 AM"}</span>
          
          <div className="flex items-center gap-1.5">
            <Signal className="w-3 h-3 text-white/70" />
            <Wifi className="w-3 h-3 text-white/70 animate-[pulse_2s_infinite]" />
            <div className="flex items-center gap-0.5">
              <span className="text-[9px] font-mono select-none">100%</span>
              <Battery className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            </div>
          </div>
        </div>

        {/* ACTIVE INNER APPLICATION WINDOW VIEWPORT */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between bg-transparent relative pb-16">
          
          {/* User profile session header block (rendered if authenticated) */}
          {isOnboarded && currentUser && (
            <div className="px-5 py-2.5 bg-black/40 border-b border-white/5 flex justify-between items-center text-xs font-light tracking-wide text-white/80">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-pink-400" />
                <span>monikered as <strong className="font-semibold text-pink-300 font-mono">@{currentUser.username}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                {currentUser.email === "gnitya2507@gmail.com" && (
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="px-2.5 py-1 bg-gradient-to-r from-yellow-500/20 to-amber-600/30 hover:from-yellow-500/30 hover:to-amber-600/40 border border-yellow-500/40 text-yellow-300 text-[10px] font-bold tracking-widest uppercase rounded-full cursor-pointer transition-all"
                  >
                    👑 Admin Panel
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  title="Disconnect from safe space"
                  className="p-1 text-white/50 hover:text-rose-400 cursor-pointer transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Welcome/Onboarding state with complete authentication subsystem */}
          {flowState === "onboarding" && (
            <div className="my-auto p-5 space-y-5 text-center max-w-sm mx-auto animate-[fadeIn_0.5s_ease-out] w-full">
              
              <div className="inline-flex p-3 rounded-full bg-white/5 border border-white/15 text-pink-400 shadow-[0_0_20px_rgba(219,39,119,0.3)]">
                <Heart className="w-7 h-7 text-pink-400 animate-[pulse_2s_infinite]" />
              </div>

              {/* AUTH VIEW: SIGN IN */}
              {authView === "signin" && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-serif italic text-white tracking-tight">Access Safe Aura</h2>
                    <p className="text-[11px] text-white/50 font-sans leading-relaxed">
                      Enter your monikered key details to restore your journals and active couple channels.
                    </p>
                  </div>

                  <form onSubmit={handleSignInSubmit} className="space-y-3.5 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-pink-300 uppercase tracking-widest pl-2">Security Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="email"
                          required
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="your.email@gmail.com"
                          className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono text-white placeholder-white/25 focus:ring-1 focus:ring-pink-500/50 focus:outline-none focus:border-pink-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-pink-300 uppercase tracking-widest pl-2">Secret Pass-Phrase</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="••••••••••••••"
                          className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono text-white placeholder-white/25 focus:ring-1 focus:ring-pink-500/50 focus:outline-none focus:border-pink-500/50 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {authError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed">
                        {authError}
                      </div>
                    )}

                    {authSuccessMsg && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] leading-relaxed">
                        {authSuccessMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-bold tracking-widest uppercase rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isAuthLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                      Unlock Space
                    </button>
                  </form>

                  <div className="flex flex-col gap-2 pt-2 text-xs text-white/40">
                    <div>
                      First time in the haven?{" "}
                      <button
                        onClick={() => { setAuthView("signup"); setAuthError(""); setAuthSuccessMsg(""); }}
                        className="text-pink-400 hover:underline font-semibold"
                      >
                        Claim sweet Moniker
                      </button>
                    </div>
                    <div>
                      Forgot pass-phrase?{" "}
                      <button
                        onClick={() => { setAuthView("recovery_request"); setAuthError(""); setAuthSuccessMsg(""); }}
                        className="text-purple-400 hover:underline font-semibold"
                      >
                        Recover Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AUTH VIEW: SIGN UP (ONE ACCOUNT ONLY PER EMAIL) */}
              {authView === "signup" && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-serif italic text-white tracking-tight">Claim Moniker</h2>
                    <p className="text-[11px] text-white/50 font-sans leading-relaxed">
                      SocialChat couples your temporary feelings to true partners. Choose a moniker and register.
                    </p>
                  </div>

                  <form onSubmit={handleSignUpSubmit} className="space-y-3.5 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-pink-300 uppercase tracking-widest pl-2">Sweet Nickname</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          required
                          maxLength={15}
                          value={authUsername}
                          onChange={(e) => setAuthUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ""))}
                          placeholder="cosy_marshmallow"
                          className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono text-white placeholder-white/25 focus:ring-1 focus:ring-pink-500/50 focus:outline-none focus:border-pink-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-pink-300 uppercase tracking-widest pl-2">Security Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="email"
                          required
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="your.email@gmail.com"
                          className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono text-white placeholder-white/25 focus:ring-1 focus:ring-pink-500/50 focus:outline-none focus:border-pink-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-pink-300 uppercase tracking-widest pl-2">Create Pass-Phrase</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="choose secure word"
                          className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono text-white placeholder-white/25 focus:ring-1 focus:ring-pink-500/50 focus:outline-none focus:border-pink-500/50 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {authError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed">
                        {authError}
                      </div>
                    )}

                    <div className="text-[10px] text-white/40 leading-relaxed px-1">
                      * One email address can be linked to one account only to guarantee digital safety and privacy constraints.
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-bold tracking-widest uppercase rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isAuthLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                      Register Moniker
                    </button>
                  </form>

                  <div className="pt-2 text-xs text-white/40">
                    Enrolled already?{" "}
                    <button
                      onClick={() => { setAuthView("signin"); setAuthError(""); setAuthSuccessMsg(""); }}
                      className="text-pink-400 hover:underline font-semibold"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* AUTH VIEW: VERIFY EMAIL (6-DIGIT CODE) */}
              {authView === "verify" && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-serif italic text-white tracking-tight">Confirm Aura Key</h2>
                    <p className="text-[11px] text-white/60 font-sans leading-relaxed">
                      We sent a secure activation email containing a <strong className="text-pink-400">6-digit verification code</strong> to <span className="font-mono text-purple-300">{authEmail}</span>.
                    </p>
                  </div>

                  <form onSubmit={handleVerifySubmit} className="space-y-4 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-pink-300 uppercase tracking-widest pl-2 block text-center">Enter 6-Digit Code</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={verificationCodeInput}
                        onChange={(e) => setVerificationCodeInput(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full text-center py-3.5 bg-white/5 border border-pink-500/20 text-lg font-bold letter-spacing-4 font-mono text-white rounded-2xl focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all focus:outline-none"
                      />
                    </div>

                    {authError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed text-center">
                        {authError}
                      </div>
                    )}

                    {authSuccessMsg && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] leading-relaxed text-center">
                        {authSuccessMsg}
                      </div>
                    )}

                    <div className="p-3 rounded-2xl bg-purple-950/40 border border-white/5 text-[10.5px] leading-relaxed text-white/50 text-center">
                      🤖 <strong className="text-purple-300">Sandbox Helper:</strong> Click the <strong className="text-pink-400">"Simulated Mailbox"</strong> pill at the top right of the page to copy your verification code instantly!
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-bold tracking-widest uppercase rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isAuthLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Approve Activation
                    </button>
                  </form>

                  <div className="pt-1">
                    <button
                      onClick={() => { setAuthView("signin"); setAuthError(""); setAuthSuccessMsg(""); }}
                      className="text-white/40 hover:text-white text-xs hover:underline font-mono"
                    >
                      ← Back to login options
                    </button>
                  </div>
                </div>
              )}

              {/* AUTH VIEW: RECOVERY REQUEST */}
              {authView === "recovery_request" && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-serif italic text-white tracking-tight">Recovery Dispatch</h2>
                    <p className="text-[11px] text-white/50 font-sans leading-relaxed">
                      Lost your security keys? Specify your registered email to request a 6-digit recovery code.
                    </p>
                  </div>

                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-pink-300 uppercase tracking-widest pl-2">Your Security Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="email"
                          required
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="your.email@gmail.com"
                          className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono text-white placeholder-white/25 focus:ring-1 focus:ring-pink-500/50 focus:outline-none focus:border-pink-500/50 transition-all"
                        />
                      </div>
                    </div>

                    {authError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed">
                        {authError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-bold tracking-widest uppercase rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isAuthLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                      Send Recovery Key
                    </button>
                  </form>

                  <div className="pt-2">
                    <button
                      onClick={() => { setAuthView("signin"); setAuthError(""); setAuthSuccessMsg(""); }}
                      className="text-pink-400 hover:underline text-xs"
                    >
                      Remembered key? Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* AUTH VIEW: RECOVERY RESET */}
              {authView === "recovery_reset" && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-serif italic text-white tracking-tight">Set New Password</h2>
                    <p className="text-[11px] text-white/60 font-sans leading-relaxed">
                      We dispatched a 6-digit verification code to your Simulated Inbox for reset validation.
                    </p>
                  </div>

                  <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[11px] text-pink-300 uppercase tracking-widest pl-2">6-Digit Recovery Code</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={recoveryCodeInput}
                        onChange={(e) => setRecoveryCodeInput(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full text-center py-2.5 bg-white/5 border border-pink-500/20 text-md font-mono font-bold text-white rounded-2xl focus:ring-1 focus:ring-pink-500/50 transition-all outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-pink-300 uppercase tracking-widest pl-2">Brand New Pass-Phrase</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="password"
                          required
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          placeholder="choose new word"
                          className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono text-white placeholder-white/25 focus:ring-1 focus:ring-pink-500/50 focus:outline-none focus:border-pink-500/50 transition-all"
                        />
                      </div>
                    </div>

                    {authError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed">
                        {authError}
                      </div>
                    )}

                    {authSuccessMsg && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] leading-relaxed text-center">
                        {authSuccessMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-bold tracking-widest uppercase rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isAuthLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Update Pass-phrase
                    </button>
                  </form>

                  <div className="pt-2">
                    <button
                      onClick={() => { setAuthView("signin"); setAuthError(""); setAuthSuccessMsg(""); }}
                      className="text-white/40 hover:text-white hover:underline text-xs"
                    >
                      Abort & Back to Sign In
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Active navigation screen components */}
          {flowState !== "onboarding" && (
            <div className="w-full flex-1 flex flex-col">
              
              {/* Tab 1: Match Screen */}
              {activeTab === "match" && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  {flowState === "input" && (
                    <EmotionInputScreen onNext={handleBeginMatch} />
                  )}

                  {flowState === "radar" && (
                    <MatchingScreen
                      userEmotion={userEmotion}
                      userMode={userMode}
                      userSong={userSong}
                      onMatchFound={handleMatchFound}
                      onCancel={() => setFlowState("input")}
                    />
                  )}

                  {flowState === "chat" && matchedPeer && myProfile && (
                    <ChatScreen
                      myProfile={myProfile}
                      matchedPeer={matchedPeer}
                      onQuit={handleCloseChat}
                      onRestartMatching={handleRestartMatching}
                    />
                  )}
                </div>
              )}

              {/* Tab 2: Journal Screen */}
              {activeTab === "journal" && <JournalScreen />}

              {/* Tab 3: Collective maps */}
              {activeTab === "collective" && <CollectiveEmotionScreen />}

            </div>
          )}

        </div>

        {/* BOTTOM GLOBAL STYLED NAVIGATION TABS BAR (Visible only when not active inside room chats) */}
        {isOnboarded && flowState !== "chat" && (
          <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-2xl border-t border-white/10 py-3.5 px-6 flex justify-around items-center z-30 shadow-2xl rounded-b-none md:rounded-b-[44px]">
            {/* Match trigger */}
            <button
              onClick={() => {
                setActiveTab("match");
                if (flowState === "chat") {
                  // do nothing or keep chat
                } else if (matchedPeer) {
                  setFlowState("chat");
                } else {
                  setFlowState("input");
                }
              }}
              className={`flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95 ${
                activeTab === "match" ? "text-pink-400 font-extrabold" : "text-white/40 hover:text-white/70"
              }`}
            >
              <Compass className={`w-5 h-5 ${activeTab === "match" ? "animate-[spin_6s_linear_infinite]" : ""}`} />
              <span className="text-[9px] uppercase tracking-widest font-bold">Connect</span>
            </button>

            {/* Journal trigger */}
            <button
              onClick={() => setActiveTab("journal")}
              className={`flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95 ${
                activeTab === "journal" ? "text-pink-400 font-extrabold" : "text-white/40 hover:text-white/70"
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[9px] uppercase tracking-widest font-bold">AI Journal</span>
            </button>

            {/* Collective trends map trigger */}
            <button
              onClick={() => setActiveTab("collective")}
              className={`flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95 ${
                activeTab === "collective" ? "text-pink-400 font-extrabold" : "text-white/40 hover:text-white/70"
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[9px] uppercase tracking-widest font-bold">Collective</span>
            </button>
          </div>
        )}

      </div>

      {/* FLOATING ACTION: SIMULATED INBOX LAUNCH PIL (Accessible at all times) */}
      <button
        onClick={() => {
          setShowSimulatedInbox(true);
          fetchSimulatedEmails();
        }}
        className="absolute bottom-4 left-4 xl:top-4 xl:bottom-auto z-50 flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-pink-500/20 to-purple-600/30 backdrop-blur-xl border border-pink-500/30 hover:border-pink-400 rounded-full hover:scale-105 active:scale-95 transition-all text-pink-300 font-mono text-xs shadow-[0_0_20px_rgba(236,72,153,0.3)] cursor-pointer"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
        </span>
        <Mail className="w-4 h-4 text-pink-400" />
        <span>Simulated Mailbox ({simulatedEmailsList.length})</span>
      </button>

      {/* MODAL: SIMULATED MAILBOX */}
      {showSimulatedInbox && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-lg bg-[#0e0716] border border-white/10 rounded-[32px] p-5 flex flex-col h-[520px] shadow-[0_0_50px_rgba(236,72,153,0.15)] relative text-white">
            
            <button
              onClick={() => setShowSimulatedInbox(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white cursor-pointer transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 MB-3 pr-8">
              <Mail className="w-6 h-6 text-pink-400" />
              <div>
                <h3 className="text-lg font-serif italic text-white">Simulated Mailbox 📬</h3>
                <p className="text-[10.5px] text-white/50 font-sans leading-relaxed">
                  Real-time mail registers for sandboxed testing. Activation links & recovery keys are synced instantly.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
              {simulatedEmailsList.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-white/30 font-sans text-xs gap-1.5 border border-dashed border-white/5 rounded-2xl">
                  <span>No activation correspondence yet.</span>
                  <span className="text-[10px] text-white/20">Trigger a registration key or recovery password first!</span>
                </div>
              ) : (
                simulatedEmailsList.map((mail) => (
                  <div key={mail.id} className="p-4 bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-2xl space-y-3 transition-all relative">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-pink-400 px-2 py-0.5 bg-pink-500/10 border border-pink-500/25 rounded-md">
                          {mail.type === "verify" ? "Verification Email" : "Recovery Code"}
                        </span>
                        <h4 className="text-xs font-semibold text-white pl-1">{mail.subject}</h4>
                        <div className="text-[10px] text-white/40 font-mono pl-1">
                          to: <span className="text-purple-300 font-bold">{mail.to}</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-white/30 font-mono">
                        {new Date(mail.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>

                    <div className="bg-[#08040d] p-3 rounded-xl border border-white/5 font-sans scale-100 flex justify-center py-4">
                      {/* Safety render the simulated template securely */}
                      <div 
                        className="text-center w-full"
                        dangerouslySetInnerHTML={{ __html: mail.html }}
                      />
                    </div>

                    <div className="flex justify-between items-center bg-[#150d22] px-3.5 py-2.5 rounded-xl border border-white/5">
                      <span className="text-[11px] font-mono text-white/50">Dispatched Code:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(mail.code);
                          alert(`Copied activation code "${mail.code}" to clipboard!`);
                        }}
                        className="p-1 px-3 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-300 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {mail.code} <span className="text-[9px] bg-pink-500/30 px-1 rounded uppercase">Copy</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-center text-[10px] text-white/30 font-mono">
              Running live on SocialChat Sandboxed Core API
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRESECURE DIVINE ADMIN STATISTICS CONTROL PANEL */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-xl bg-[#09040d] border border-yellow-500/30 rounded-[36px] p-6 flex flex-col h-[560px] shadow-[0_0_50px_rgba(234,179,8,0.15)] relative text-white">
            
            <button
              onClick={() => setShowAdminPanel(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white cursor-pointer transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4 pr-10">
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-full">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-serif italic text-white flex items-center gap-1.5">
                  Divine Admin Panel <span className="text-xs font-mono text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">Supreme</span>
                </h3>
                <p className="text-[11px] text-white/50 font-sans leading-relaxed">
                  Only the site owner <span className="text-yellow-300 font-mono">gnitya2507@gmail.com</span> has permission keys to audit database structures.
                </p>
              </div>
            </div>

            {/* STATISTICS OVERVIEW BENTO ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4 text-center">
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-white/50 block">Signed Up</span>
                <strong className="text-xl font-mono text-white mt-1 block">
                  {isAdminLoading ? "..." : adminStats?.totalUsers ?? 0}
                </strong>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-pink-400 block">Verified</span>
                <strong className="text-xl font-mono text-pink-400 mt-1 block">
                  {isAdminLoading ? "..." : adminStats?.verifiedUsers ?? 0}
                </strong>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-amber-500 block">Pending</span>
                <strong className="text-xl font-mono text-amber-500 mt-1 block">
                  {isAdminLoading ? "..." : adminStats?.unverifiedUsers ?? 0}
                </strong>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-teal-400 block">Feelings Log</span>
                <strong className="text-xl font-mono text-teal-400 mt-1 block">
                  {isAdminLoading ? "..." : adminStats?.totalCollectiveFeels ?? 0}
                </strong>
              </div>
            </div>

            {/* USER SEARCH ENGINE */}
            <div className="relative mb-3.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                placeholder="Query registers by Nickname or Email address..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 text-xs font-mono rounded-2xl text-white placeholder-white/25 focus:ring-1 focus:ring-yellow-500/50 outline-none"
              />
            </div>

            {/* AUDIT LIST CONTAINER */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-1">
              {isAdminLoading ? (
                <div className="h-40 flex items-center justify-center text-xs font-mono text-white/30 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synchronizing database. Please wait...</span>
                </div>
              ) : !adminStats?.usersList || adminStats.usersList.length === 0 ? (
                <div className="text-center py-10 text-xs text-white/30 border border-white/5 rounded-2xl">
                  No registered users found.
                </div>
              ) : (
                adminStats.usersList
                  .filter((u: any) => 
                    u.username.includes(adminSearchQuery.toLowerCase()) || 
                    u.email.includes(adminSearchQuery.toLowerCase())
                  )
                  .map((u: any) => (
                    <div key={u.email} className="p-3 bg-white/[0.03] hover:bg-white/5 border border-white/5 rounded-xl flex justify-between items-center gap-3 transition-all">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-white">@{u.username}</span>
                          <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                            u.status === "verified" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {u.status}
                          </span>
                          {u.email === "gnitya2507@gmail.com" && (
                            <span className="text-[8px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 rounded">
                              Owner
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-white/40 font-mono">{u.email}</div>
                        <div className="text-[9px] text-white/20">
                          Joined haven: {new Date(u.joinedAt).toLocaleString()}
                        </div>
                      </div>

                      {u.email !== "gnitya2507@gmail.com" && (
                        <button
                          onClick={() => handleDeleteUser(u.email)}
                          title="Revoke and delete user record"
                          className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 hover:text-white text-[10px] tracking-widest font-bold uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      )}
                    </div>
                  ))
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center text-[10.5px] text-white/40 font-mono">
              <div className="flex items-center gap-1">
                <span>Database File:</span>
                <span className="text-yellow-500 font-bold">users-db.json</span>
              </div>
              <button
                onClick={fetchAdminStats}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:text-yellow-400 text-[10px] tracking-wider uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Logs</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

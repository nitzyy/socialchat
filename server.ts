import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// ------------------- FILE-BASED DATABASE DEFINITIONS -------------------
const DB_FILE_PATH = path.join(process.cwd(), "users-db.json");

// In-memory queue of simulated sent emails for the floating notification receiver component
interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  code: string;
  timestamp: number;
  type: "verify" | "recovery";
}
let simulatedEmails: SimulatedEmail[] = [
  {
    id: "welcome-email",
    to: "silent_echo@gmail.com",
    subject: "🌸 Complete your SocialChat Onboarding",
    html: `<div style="font-family: inherit; padding: 20px; background-color: #0d0714; color: #ffffff; border-radius: 20px; border: 1px solid rgba(244,63,94,0.2);">
      <h2 style="color: #ec4899; font-style: italic;">Welcome to SocialChat!</h2>
      <p style="color: rgba(255,255,255,0.7); font-size: 13px;">Your sweet anonymous safe space is almost ready. Complete your registration using this verification code:</p>
      <div style="font-family: monospace; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #f472b6; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 12px; display: inline-block; margin: 15px 0;">777888</div>
      <p style="color: rgba(255,255,255,0.4); font-size: 11px;">If you didn't trigger this safe window, you can ignore this note safely.</p>
    </div>`,
    code: "777888",
    timestamp: Date.now() - 1200 * 1000,
    type: "verify"
  }
];

function readUsersDB() {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      // Seed default testing database
      const initialUsers = [
        {
          email: "gnitya2507@gmail.com",
          username: "gnitya_admin",
          password: "Password123",
          status: "verified",
          joinedAt: Date.now() - 5 * 24 * 3600 * 1000
        },
        {
          email: "cozy_healer@gmail.com",
          username: "cozy_healer",
          password: "Password123",
          status: "verified",
          joinedAt: Date.now() - 3 * 24 * 3600 * 1000
        },
        {
          email: "neon_soul@gmail.com",
          username: "neon_soul",
          password: "Password123",
          status: "verified",
          joinedAt: Date.now() - 1 * 24 * 3600 * 1000
        },
        {
          email: "silent_echo@gmail.com",
          username: "silent_echo",
          password: "Password123",
          status: "unverified",
          verificationCode: "777888",
          joinedAt: Date.now() - 1200 * 1000
        }
      ];
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialUsers, null, 2), "utf-8");
      return initialUsers;
    }
    const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read user database, falling back to memory:", err);
    return [];
  }
}

function writeUsersDB(users: any[]) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to user database:", err);
  }
}

// Ensure the database file is initialized
readUsersDB();

// Initialize GoogleGenAI SDK with AI Studio Telemetry headers
const aiConfig = {
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
};
const ai = new GoogleGenAI(aiConfig);

// Keep an anonymous in-memory queue of global submitted emotions for "Today's Collective Emotion"
const globalEmotionsQueue: { id: string; word: string; timestamp: number }[] = [
  { id: "1", word: "lonely", timestamp: Date.now() - 3600 * 1000 },
  { id: "2", word: "anxious", timestamp: Date.now() - 7200 * 1000 },
  { id: "3", word: "excited", timestamp: Date.now() - 4000 * 1000 },
  { id: "4", word: "peaceful", timestamp: Date.now() - 10000 * 1000 },
  { id: "5", word: "overwhelmed", timestamp: Date.now() - 2000 * 1000 },
  { id: "6", word: "numb", timestamp: Date.now() - 50 * 1000 },
  { id: "7", word: "tired", timestamp: Date.now() - 500 * 1000 },
  { id: "8", word: "unheard", timestamp: Date.now() - 1200 * 1000 },
];

// Helper method to get the correct model
const TEXT_MODEL = "gemini-3.5-flash";

// ------------------- API ROUTES -------------------

// ------------------- AUTHENTICATION AND DATABASE APIS -------------------

// Get raw logs of simulated emails sent to registered addresses
app.get("/api/auth/simulated-emails", (req, res) => {
  res.json(simulatedEmails.slice(-30).sort((a,b) => b.timestamp - a.timestamp));
});

// Signup
app.post("/api/auth/signup", (req, res) => {
  const { email, username, password } = req.body;
  
  if (!email || !username || !password) {
    return res.status(400).json({ error: "All fields are required to secure your aura." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.toLowerCase().trim().replace(/\s/g, "_");

  const db = readUsersDB();
  const existingEmail = db.find(u => u.email === normalizedEmail);
  if (existingEmail && existingEmail.status === "verified") {
    return res.status(400).json({ error: "This email is already linked to another safe account. Try logging in or resetting password!" });
  }

  // Check if username is taken by a verified user
  const existingUsername = db.find(u => u.username === normalizedUsername);
  if (existingUsername && existingUsername.status === "verified" && existingUsername.email !== normalizedEmail) {
    return res.status(400).json({ error: "This nickname is already claimed. Pick another sweet moniker!" });
  }

  // Generate 6-digit confirmation code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Remove existing unverified record for this email if any
  const filteredDB = db.filter(u => u.email !== normalizedEmail);

  // Add the newly registering user
  const newUser = {
    email: normalizedEmail,
    username: normalizedUsername,
    password, // Store as is for simple testing/readiness
    status: "unverified",
    verificationCode,
    joinedAt: Date.now()
  };

  filteredDB.push(newUser);
  writeUsersDB(filteredDB);

  // Send a simulated verification email
  const emailHtml = `
    <div style="font-family: inherit; padding: 24px; background-color: #0c0615; color: #ffffff; border-radius: 24px; border: 1px solid rgba(236,72,153,0.3); max-width: 450px; margin: auto; text-align: center;">
      <span style="font-size: 32px; display: block; margin-bottom: 12px;">🌸</span>
      <h2 style="color: #f472b6; font-style: italic; font-weight: normal; margin-top: 0;">Validate Your Spirit Moniker</h2>
      <p style="color: rgba(255, 255, 255, 0.7); font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
        Hello <strong>@${normalizedUsername}</strong>! To protect your journals and active connections from telemetry logs, approve this session code:
      </p>
      <div style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ec4899; padding: 16px; background: rgba(236,72,153,0.1); border: 1px dashed rgba(236,72,153,0.3); border-radius: 16px; display: inline-block; margin-bottom: 24px;">
        ${verificationCode}
      </div>
      <p style="color: rgba(255, 255, 255, 0.45); font-size: 10px; margin-top: 10px;">
        Expires in 15 minutes · SocialChat Healing Gateway
      </p>
    </div>
  `;

  simulatedEmails.push({
    id: `verify-${Date.now()}`,
    to: normalizedEmail,
    subject: `🌸 Verify @${normalizedUsername} on SocialChat`,
    html: emailHtml,
    code: verificationCode,
    timestamp: Date.now(),
    type: "verify"
  });

  res.json({ success: true, email: normalizedEmail, username: normalizedUsername });
});

// Verify Code
app.post("/api/auth/verify", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Verification parameters missing." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = readUsersDB();
  const userIdx = db.findIndex(u => u.email === normalizedEmail);

  if (userIdx === -1) {
    return res.status(404).json({ error: "Registration session not found." });
  }

  const user = db[userIdx];
  if (user.verificationCode !== code.trim()) {
    return res.status(400).json({ error: "The 6-digit confirmation code did not match. Please verify using your Simulated Inbox log!" });
  }

  user.status = "verified";
  delete user.verificationCode;
  db[userIdx] = user;
  writeUsersDB(db);

  res.json({ success: true, user: { email: user.email, username: user.username, joinedAt: user.joinedAt } });
});

// Signin
app.post("/api/auth/signin", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Please enter your email and pass-phrase." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = readUsersDB();
  const user = db.find(u => u.email === normalizedEmail);

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "No matching spiritual avatar found or invalid pass-phrase." });
  }

  if (user.status === "unverified") {
    // Generate a fresh code and send verification email again!
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    writeUsersDB(db);

    simulatedEmails.push({
      id: `verify-resend-${Date.now()}`,
      to: normalizedEmail,
      subject: `🌸 [New Code] Verify @${user.username} on SocialChat`,
      html: `
        <div style="font-family: inherit; padding: 24px; background-color: #0c0615; color: #ffffff; border-radius: 20px; text-align: center; border: 1px solid rgba(236,72,153,0.3);">
          <p style="font-size: 13px;">Confirm registration with code:</p>
          <div style="font-size: 28px; font-weight: bold; color: #f472b6; font-family: monospace; letter-spacing: 5px;">${verificationCode}</div>
        </div>
      `,
      code: verificationCode,
      timestamp: Date.now(),
      type: "verify"
    });

    return res.status(403).json({
      error: "This email registration is pending verification. A fresh 6-digit verification code has been dispatched to your Simulated Inbox!",
      unverified: true,
      email: normalizedEmail,
      username: user.username
    });
  }

  res.json({ success: true, user: { email: user.email, username: user.username, joinedAt: user.joinedAt } });
});

// Forgot Password -> Recovery Code
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Please enter your registered email address." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = readUsersDB();
  const userIdx = db.findIndex(u => u.email === normalizedEmail);

  if (userIdx === -1) {
    return res.status(404).json({ error: "We couldn't find an active account with that email." });
  }

  const user = db[userIdx];
  const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.recoveryCode = recoveryCode;
  db[userIdx] = user;
  writeUsersDB(db);

  // Send simulated Email
  const emailHtml = `
    <div style="font-family: inherit; padding: 24px; background-color: #0c0615; color: #ffffff; border-radius: 24px; border: 1px solid rgba(139,92,246,0.3); max-width: 450px; margin: auto; text-align: center;">
      <span style="font-size: 32px; display: block; margin-bottom: 12px;">🗝️</span>
      <h2 style="color: #a78bfa; font-style: italic; font-weight: normal; margin-top: 0;">Account Recovery Access</h2>
      <p style="color: rgba(255, 255, 255, 0.7); font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
        Hello <strong>@${user.username}</strong>! We generated a 6-digit recovery key so you can change your password safely.
      </p>
      <div style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #a78bfa; padding: 16px; background: rgba(139,92,246,0.1); border: 1px dashed rgba(139,92,246,0.3); border-radius: 16px; display: inline-block; margin-bottom: 24px;">
        ${recoveryCode}
      </div>
      <p style="color: rgba(255, 255, 255, 0.45); font-size: 10px; margin-top: 10px;">
        If you didn't request a recovery key, your password remains secure.
      </p>
    </div>
  `;

  simulatedEmails.push({
    id: `recover-${Date.now()}`,
    to: normalizedEmail,
    subject: "🗝️ SocialChat Pass-phrase Reset Key",
    html: emailHtml,
    code: recoveryCode,
    timestamp: Date.now(),
    type: "recovery"
  });

  res.json({ success: true, email: normalizedEmail });
});

// Reset Password with Recovery Code
app.post("/api/auth/reset-password", (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: "Email, recovery code, and new password are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = readUsersDB();
  const userIdx = db.findIndex(u => u.email === normalizedEmail);

  if (userIdx === -1) {
    return res.status(404).json({ error: "User session expired." });
  }

  const user = db[userIdx];
  if (!user.recoveryCode || user.recoveryCode !== code.trim()) {
    return res.status(400).json({ error: "The recovery code is incorrect or expired. Check Simulated Inbox!" });
  }

  // Update password, clear recovery keys, auto verify
  user.password = newPassword;
  user.status = "verified";
  delete user.recoveryCode;
  
  db[userIdx] = user;
  writeUsersDB(db);

  res.json({ success: true, user: { email: user.email, username: user.username, joinedAt: user.joinedAt } });
});

// Admin Panel statistics
app.get("/api/admin/stats", (req, res) => {
  const adminEmail = req.query.adminEmail;
  if (adminEmail !== "gnitya2507@gmail.com") {
    return res.status(403).json({ error: "Unauthorized. Divine access is restricted to the site owner." });
  }

  const db = readUsersDB();
  const totalUsers = db.length;
  const verifiedUsers = db.filter(u => u.status === "verified").length;
  const unverifiedUsers = db.filter(u => u.status === "unverified").length;

  // Filter out passwords from the data we return to the UI
  const safeUsersList = db.map(u => ({
    email: u.email,
    username: u.username,
    status: u.status,
    joinedAt: u.joinedAt
  }));

  res.json({
    totalUsers,
    verifiedUsers,
    unverifiedUsers,
    usersList: safeUsersList,
    totalCollectiveFeels: globalEmotionsQueue.length,
    dbFilePath: DB_FILE_PATH,
    apiHealth: "healthy"
  });
});

// Admin delete/revoke user
app.post("/api/admin/delete-user", (req, res) => {
  const { adminEmail, emailToDelete } = req.body;

  if (adminEmail !== "gnitya2507@gmail.com") {
    return res.status(403).json({ error: "Divine access is required." });
  }

  if (!emailToDelete) {
    return res.status(400).json({ error: "Target email parameter is missing." });
  }

  const db = readUsersDB();
  const filtered = db.filter(u => u.email !== emailToDelete);

  if (db.length === filtered.length) {
    return res.status(404).json({ error: "Aura not found in the registers." });
  }

  writeUsersDB(filtered);
  res.json({ success: true, remaining: filtered.length });
});

// 1. Post/Log an emotion to the global collective queue
app.post("/api/collective/mood", (req, res) => {
  const { emotion } = req.body;
  if (emotion && typeof emotion === "string") {
    // Trim and sanitize
    const sanitized = emotion.toLowerCase().trim().slice(0, 30);
    globalEmotionsQueue.push({
      id: Math.random().toString(),
      word: sanitized,
      timestamp: Date.now(),
    });
    // Keep max 200 items in queue to avoid bloat
    if (globalEmotionsQueue.length > 200) {
      globalEmotionsQueue.shift();
    }
  }
  res.json({ success: true, count: globalEmotionsQueue.length });
});

// 2. Retrieve collective emotion summaries and metrics
app.get("/api/collective/trends", async (req, res) => {
  try {
    const list = globalEmotionsQueue.map((e) => e.word);
    const countMap: Record<string, number> = {};
    list.forEach((e) => {
      countMap[e] = (countMap[e] || 0) + 1;
    });

    const mostCommon = Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);

    // Call Gemini to get a comforting collective aura summary quote
    let summaryQuote = "In this space, we breathe, connect, and remember that no feeling is final.";
    if (list.length > 0) {
      try {
        const response = await ai.models.generateContent({
          model: TEXT_MODEL,
          contents: `We have a collective of real-time feelings from users tonight: ${list.join(", ")}. Write a short, comforting, 1-sentence poetic atmospheric summary or quote that makes them feel less alone, in cutesy/Gen Z warm healing style. No markdown.`,
        });
        if (response.text) {
          summaryQuote = response.text.trim().replace(/^"|"$/g, "");
        }
      } catch (e) {
        console.error("Failed to generate collective quote:", e);
      }
    }

    // Generate semi-random hours count for visualization
    const hours = ["12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
    const historicalTrend = hours.map((hour, idx) => ({
      hour,
      count: Math.floor(Math.random() * 15) + 5 + idx,
      primaryEmotion: mostCommon[idx % (mostCommon.length || 1)] || "hopeful",
    }));

    res.json({
      mostCommon: mostCommon.length ? mostCommon : ["hopeful", "thoughtful"],
      totalSubmissions: globalEmotionsQueue.length,
      atmosphereQuote: summaryQuote,
      historicalTrend,
      regionalAura: "linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)"
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load collective trends" });
  }
});

// 3. AI Generated Story Cards summarizing a Chat Session
app.post("/api/gemini/story-card", async (req, res) => {
  const { messages, emotionOne, emotionTwo } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  const conversationText = messages
    .slice(-15) // take last 15 messages for high relevance
    .map((m) => `${m.senderName}: ${m.text}`)
    .join("\n");

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `You are creating a Mood Story Card summarizing a deep exchange between two anonymous people.
Emotion User 1: "${emotionOne}"
Emotion User 2: "${emotionTwo}"
Conversation transcripts:
${conversationText}

Generate a JSON object containing:
- "quote": an extremely poetic, evocative, cutesy, but deep and comforting statement (max 10-14 words) representing the vibe of their emotional pairing. Use phrases similar to "A tiny light in a cloudy sky tonight", "Maybe things feel a little softer now", "We talked, and the night got a bit warm", "It felt safe telling you everything". Avoid cheesy corporate cliches.
- "subquote": a short sub-line of 4-7 words (like "Someone understood my silence" or "Soft rain inside a quiet room").
- "theme": Choose EXACTLY one option among: "melancholy", "warmth", "cloud", "cosmic", "lavender", "neon".

Output strictly valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING },
            subquote: { type: Type.STRING },
            theme: { type: Type.STRING },
          },
          required: ["quote", "subquote", "theme"],
        },
      },
    });

    const bodyText = response.text || "{}";
    res.json(JSON.parse(bodyText.trim()));
  } catch (err: any) {
    console.error("Story Card Generation error:", err);
    // Return a beautiful fallback card
    res.json({
      quote: "Maybe we are just stars looking for another lonely constellation.",
      subquote: "Tonight, things felt a little lighter.",
      theme: "cosmic",
    });
  }
});

// 4. Generate AI Playlist Recommendations after matching
app.post("/api/gemini/playlist", async (req, res) => {
  const { emotionOne, emotionTwo, messages } = req.body;
  const convo = messages ? messages.slice(-8).map((m: any) => m.text).join(" ") : "";

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `Formulate a Shared Healing Playlist based on these parameters:
User 1's Emotion: "${emotionOne}"
User 2's Emotion: "${emotionTwo}"
Conversation context snippet: "${convo}"

Create a comforting, beautiful sound playlist that would soothe or empower both users. Create a playlist title, a brief comforting description, and select EXACTLY a category from: "healing", "calming", "hopeful", "comforting", "grounding", "motivational".
Also generate 5 gorgeous real-life song recommendations matching this mood.

Output JSON:
{
  "title": "string",
  "description": "string",
  "category": "healing | calming | hopeful | comforting | grounding | motivational",
  "songs": [
    { "id": "1", "title": "Song Name", "artist": "Artist name", "albumArt": "placeholder-art-url" }
  ]
}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            songs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  artist: { type: Type.STRING },
                },
                required: ["title", "artist"],
              },
            },
          },
          required: ["title", "description", "category", "songs"],
        },
      },
    });

    const data = JSON.parse((response.text || "{}").trim());
    // Attach cutesy random visual album arts
    const arts = [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=150&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=60"
    ];
    data.songs = data.songs.map((s: any, idx: number) => ({
      id: `pl-${idx}-${Date.now()}`,
      title: s.title,
      artist: s.artist,
      albumArt: arts[idx % arts.length],
    }));

    res.json(data);
  } catch (err) {
    console.error("Failed playlist gen:", err);
    res.json({
      title: "Gentle Nightfall",
      description: "A soft blend of acoustic chords and ambient warmth to remind you to take a slow breath.",
      category: "calming",
      songs: [
        { id: "1", title: "Sweater Weather", artist: "The Neighbourhood", albumArt: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=60" },
        { id: "2", title: "Saturn", artist: "Sleeping At Last", albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=60" },
        { id: "3", title: "Until I Found You", artist: "Stephen Sanchez", albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&auto=format&fit=crop&q=60" },
      ],
    });
  }
});

// 5. Suggested Icebreaker Prompts
app.post("/api/gemini/icebreaker", async (req, res) => {
  const { emotionOne, emotionTwo, messages } = req.body;
  const convoText = messages ? messages.slice(-5).map((m: any) => `${m.senderName}: ${m.text}`).join("\n") : "";

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `We are running a cutesy healing chat called SocialChat. Give 3 short, gentle, therapeutic, or fun conversation starter ideas (icebreakers) that are highly relevant to their pairing. Keep them very cozy, easy, and comfortable.
Emotion User 1: "${emotionOne}"
Emotion User 2: "${emotionTwo}"
Conversation state (if any):
${convoText}

Output strictly inside JSON under "icebreakers" as an array of strings. Maximum length of each prompt is 15 words.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            icebreakers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["icebreakers"],
        },
      },
    });

    const parsed = JSON.parse((response.text || "{}").trim());
    res.json(parsed);
  } catch (err) {
    res.json({
      icebreakers: [
        "what song makes you feel complete?",
        "if you could put your current emotion in a painting, what color would it be?",
        "what is one small thing that made today bearable?"
      ],
    });
  }
});

// 6. AI Reflection analyzer for the Electronic Diary / Timeline
app.post("/api/gemini/journal-reflection", async (req, res) => {
  const { reflection, emotionWord, emotionValue } = req.body;
  if (!reflection || typeof reflection !== "string") {
    return res.status(400).json({ error: "Reflection text is required." });
  }

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `A user has logged a diary entry in their secure, emotional growth journal inside SocialChat.
Current logged emotion: "${emotionWord}" (Intensity rating: ${emotionValue}/5)
Diary entry text:
"${reflection}"

Analyze this log and provide a JSON response summarizing their emotional insight recursively:
- "auraColor": Generate a beautiful, soft, multi-colored CSS radial or linear gradient value (e.g. "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)", or similar dreamy pastel tones representing their current emotional code). No dark or aggressive colors, only sweet supportive calming elements!
- "summary": A highly supportive, validating, warm analysis (max 30 words) from a friendly spiritual therapist.
- "pattern": A brief note pointing out their growth perspective (e.g., "you are recognizing the importance of breathing room", "even inside quietness, you seek human sparks").

Output JSON schema precisely:`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            auraColor: { type: Type.STRING },
            summary: { type: Type.STRING },
            pattern: { type: Type.STRING },
          },
          required: ["auraColor", "summary", "pattern"],
        },
      },
    });

    const fileText = response.text || "{}";
    res.json(JSON.parse(fileText.trim()));
  } catch (err) {
    res.json({
      auraColor: "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)",
      summary: "Your feelings are valid. Giving space to your thoughts is a huge step in self-care.",
      pattern: "You are active in processing difficult moments with courage.",
    });
  }
});

// 7. Simulated Peer Chat Responses (Solo Mode Backup)
app.post("/api/gemini/peer-chat", async (req, res) => {
  const { messages, peerName, peerEmotion, peerMode, peerSong } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages list is required." });
  }

  const promptBuilder = [
    `You are roleplaying as a real user named "${peerName}" in a cutesy/aesthetic mobile-first chat application called "SocialChat".`,
    `Your current emotion is "${peerEmotion}".`,
    `You are connecting in "${peerMode}" mode (balanced means you both share similar feelings; unbalanced means you have opposite or balancing vibes).`,
    peerSong ? `You are currently listening to "${peerSong.title}" by "${peerSong.artist}".` : "",
    `Here are the core rules:`,
    `- Act like a REAL Gen Z human. Use lowercase, simple punctuation, warm cutesy tone, slang like 'so true', 'ikr', 'tbh', 'idk', 'soft times', 'healing', 'oh no'.`,
    `- Do NOT act like a therapy AI assistant. Do NOT say 'As an AI' or 'I am here to help you'. You are just another normal, vulnerable user seeking emotional connection.`,
    `- Be supportive, empathetic, and cozy. Ask questions occasionally to keep the connection deep.`,
    `- Speak in short, digestible text structures (1 to 2 short lines max per message).`,
    `Here is the conversation log:`,
    ...messages.slice(-15).map((m) => `${m.senderName}: ${m.text}`),
    `Generate the next single response representing "${peerName}". Do not prefix with your name, just output the message text itself.`
  ].join("\n");

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: promptBuilder,
    });
    const reply = (response.text || "hey...").trim().replace(/^"/g, "").replace(/"$/g, "");
    res.json({ text: reply });
  } catch (err) {
    res.json({ text: "yeah, i totally feel you. it's so nice to talk to someone who gets it." });
  }
});

// ------------------- VITE & STATIC HANDLING -------------------

async function mountExpressVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SocialChat Server] Listening at http://0.0.0.0:${PORT}`);
  });
}

mountExpressVite();

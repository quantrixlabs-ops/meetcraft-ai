import path from "path";
import dotenv from "dotenv";

// 🔥 FORCE ABSOLUTE .env PATH
const envPath = path.resolve(process.cwd(), ".env");
const result = dotenv.config({ path: envPath });

console.log("📂 Working Directory:", process.cwd());
console.log("📄 Loading .env from:", envPath);

if (result.error) {
  console.error("❌ Failed to load .env file:", result.error);
}

console.log("🔑 ENV VITE_GEMINI_API_KEY:", process.env.VITE_GEMINI_API_KEY ? "Loaded ✅" : "Missing ❌");

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { aiRouter } from "./routes";
import { exportRouter } from "./exportRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { GoogleGenAI, LiveServerMessage } from "@google/genai";

if (!process.env.VITE_GEMINI_API_KEY) {
  console.error("🚨 VITE_GEMINI_API_KEY is missing. Server will not start.");
  process.exit(1);
}

async function startServer() {
  console.log("🚀 Starting server initialization...");

  const app = express();

  /*if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }*/ 
  const PORT = Number(process.env.PORT) || 5001;

  app.use(cors());
  app.use(express.json({ limit: "10mb" }) as any);

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      env: process.env.NODE_ENV
    });
  });

  app.use("/api/ai", aiRouter);
  app.use("/api/export", exportRouter);
  app.use(errorHandler as any);

  const server = createServer(app);

  const wss = new WebSocketServer({ server, path: "/ws/live" });

  wss.on("connection", async (ws: WebSocket) => {
    console.log("[Gemini Live] Client connected");

    try {
      const client = new GoogleGenAI({
        apiKey: process.env.VITE_GEMINI_API_KEY!
      });

      const session = await client.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        callbacks: {
          onopen: () => console.log("[Gemini Live] Session Connected"),
          onmessage: (msg: LiveServerMessage) => ws.send(JSON.stringify(msg)),
          onclose: () => {
            console.log("[Gemini Live] Session Closed");
            ws.close();
          },
          onerror: (err) => {
            console.error("[Gemini Live] Session Error", err);
            ws.close();
          }
        },
        config: {
          systemInstruction: "You are a helpful and knowledgeable AI tutor."
        }
      });

      ws.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.realtimeInput) {
            session.sendRealtimeInput(parsed.realtimeInput);
          }
        } catch {}
      });

      ws.on("close", () => {
        console.log("[Gemini Live] Client disconnected");
      });

    } catch (err) {
      console.error("Gemini Live Connection Failed", err);
      ws.close(1011, "Upstream Error");
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Server running on http://localhost:${PORT}`);
  });
}

startServer();
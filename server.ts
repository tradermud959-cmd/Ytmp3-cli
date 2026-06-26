import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);
  const io = new SocketIOServer(server);

  const getStats = () => {
    try {
      const historyPath = path.join(process.cwd(), 'data/history.json');
      const configPath = path.join(process.cwd(), 'config/config.json');
      
      let history: any[] = [];
      let config = { defaultLocation: 'Download' };
      
      if (fs.existsSync(historyPath)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
          history = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          history = [];
        }
      }
      if (fs.existsSync(configPath)) {
        try {
          const parsedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          config = parsedConfig && typeof parsedConfig === 'object' ? parsedConfig : { defaultLocation: 'Download' };
        } catch (e) {
          config = { defaultLocation: 'Download' };
        }
      }

      const totalDownloads = history.length;
      
      const today = new Date().toISOString().split('T')[0];
      const downloadsToday = history.filter((h: any) => h?.date && h.date.startsWith(today)).length;
      
      const totalAudio = history.filter((h: any) => h?.type === 'audio').length;
      const totalVideo = history.filter((h: any) => h?.type === 'video').length;

      let totalSize = 0;
      for (const item of history) {
        if (item?.path && fs.existsSync(item.path)) {
            try {
                const stats = fs.statSync(item.path);
                totalSize += stats.size;
            } catch (e) {
                // ignore
            }
        }
      }

      return {
        totalDownloads,
        downloadsToday,
        totalAudio,
        totalVideo,
        totalSize,
        history: history.reverse(), // most recent first
        config
      };
    } catch (err) {
      console.error("Error in getStats:", err);
      return {
        totalDownloads: 0,
        downloadsToday: 0,
        totalAudio: 0,
        totalVideo: 0,
        totalSize: 0,
        history: [],
        config: { defaultLocation: 'Download' }
      };
    }
  };

  // Socket.IO
  io.on('connection', (socket) => {
    socket.emit('statsUpdate', getStats());
  });

  // Broadcast stats every 3 seconds
  setInterval(() => {
    io.emit('statsUpdate', getStats());
  }, 3000);

  // API Routes
  app.get("/api/stats", (req, res) => {
    try {
      res.json(getStats());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Dashboard Server running on http://localhost:${PORT}`);
  });
}

startServer();

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"));
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
var import_http = __toESM(require("http"));
var import_socket = require("socket.io");
var import_vite = require("vite");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  const server = import_http.default.createServer(app);
  const io = new import_socket.Server(server);
  const getStats = () => {
    try {
      const historyPath = import_path.default.join(process.cwd(), "data/history.json");
      const configPath = import_path.default.join(process.cwd(), "config/config.json");
      let history = [];
      let config = { defaultLocation: "Download" };
      if (import_fs.default.existsSync(historyPath)) {
        try {
          const parsed = JSON.parse(import_fs.default.readFileSync(historyPath, "utf8"));
          history = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          history = [];
        }
      }
      if (import_fs.default.existsSync(configPath)) {
        try {
          const parsedConfig = JSON.parse(import_fs.default.readFileSync(configPath, "utf8"));
          config = parsedConfig && typeof parsedConfig === "object" ? parsedConfig : { defaultLocation: "Download" };
        } catch (e) {
          config = { defaultLocation: "Download" };
        }
      }
      const totalDownloads = history.length;
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const downloadsToday = history.filter((h) => h?.date && h.date.startsWith(today)).length;
      const totalAudio = history.filter((h) => h?.type === "audio").length;
      const totalVideo = history.filter((h) => h?.type === "video").length;
      let totalSize = 0;
      for (const item of history) {
        if (item?.path && import_fs.default.existsSync(item.path)) {
          try {
            const stats = import_fs.default.statSync(item.path);
            totalSize += stats.size;
          } catch (e) {
          }
        }
      }
      return {
        totalDownloads,
        downloadsToday,
        totalAudio,
        totalVideo,
        totalSize,
        history: history.reverse(),
        // most recent first
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
        config: { defaultLocation: "Download" }
      };
    }
  };
  io.on("connection", (socket) => {
    socket.emit("statsUpdate", getStats());
  });
  setInterval(() => {
    io.emit("statsUpdate", getStats());
  }, 3e3);
  app.get("/api/stats", (req, res) => {
    try {
      res.json(getStats());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Dashboard Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

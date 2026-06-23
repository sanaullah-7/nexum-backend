const http = require("http");
const dns = require("dns");

const dotenv = require("dotenv");

const app = require("./src/app");
const { connectDb } = require("./src/config/db");


dotenv.config();

if (process.env.DNS_SERVERS) {
  const servers = process.env.DNS_SERVERS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (servers.length) {
    dns.setServers(servers);
  }
}

const port = Number(process.env.PORT || 4000);
const server = http.createServer(app);

server.on("error", (err) => {
  if (err?.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
    console.error(
      `Stop the running process or change PORT in backend/.env. (Windows: netstat -ano | findstr ":${port}" then taskkill /PID <pid> /F)`,
    );
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

async function start() {
  server.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port} (pid ${process.pid})`);
  });

  try {
    await connectDb(process.env.MONGODB_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error(
      `MongoDB not connected (${err?.code || "ERR"}): ${err?.message || err}`,
    );
  }
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

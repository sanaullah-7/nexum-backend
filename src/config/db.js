const mongoose = require('mongoose');
const dns = require('dns');

let connectionPromise;
let dnsConfigured = false;

function configureDnsFromEnv() {
  if (dnsConfigured) return;
  dnsConfigured = true;

  if (!process.env.DNS_SERVERS) return;
  const servers = process.env.DNS_SERVERS.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (servers.length) {
    dns.setServers(servers);
  }
}

async function connectDb(mongoUri) {
  if (!mongoUri) {
    throw new Error('Missing MONGODB_URI');
  }

  configureDnsFromEnv();

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 8000,
  });

  return mongoose.connection;
}

async function ensureDbConnected(mongoUri) {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = connectDb(mongoUri).catch((err) => {
      connectionPromise = undefined;
      throw err;
    });
  }

  return connectionPromise;
}

module.exports = {
  connectDb,
  ensureDbConnected,
};

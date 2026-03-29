

const app = require("./app");
const { env } = require("./config/env");
const { query } = require("./config/db");
const crypto = require("crypto");
const fetch = require("node-fetch");
const { Server } = require("socket.io");

let io;

try {
  const server = app.listen(env.PORT, () => {
    console.log(`Servidor corriendo en puerto ${env.PORT}`);
  });

  io = new Server(server, {
    cors: { origin: "*" }
  });
} catch (err) {
  console.error("Error crítico al iniciar el backend:", err);
  process.exit(1);
}

async function triggerWebhook(event, payload) {
  const hooks = await query(`SELECT * FROM webhooks`);

  for (const hook of hooks) {
    const signature = crypto
      .createHmac("sha256", hook.secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    await fetch(hook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": signature
      },
      body: JSON.stringify({ event, payload })
    });
  }
}

module.exports = { io, triggerWebhook };
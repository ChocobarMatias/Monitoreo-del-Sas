
const fetch = require("node-fetch");

const TOKEN = "TU_BOT_TOKEN";
const CHAT_ID = "TU_CHAT_ID";

async function sendTelegram(message) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message
    })
  });
}

module.exports = { sendTelegram };
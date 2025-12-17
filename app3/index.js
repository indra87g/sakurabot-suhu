require("dotenv").config({ path: __dirname + "/.env" });

const TelegramBot = require("node-telegram-bot-api");
const { exec } = require("child_process");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const OWNER_ID = String(process.env.OWNER_ID);

function isOwner(msg) {
  return String(msg.from?.id) === OWNER_ID;
}

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout || "OK");
    });
  });
}

// === /start ===
bot.onText(/\/start/, (msg) => {
  if (!isOwner(msg)) return;
  bot.sendMessage(msg.chat.id, `
🤖 *PM2 Control Bot*

Commands:
/status
/stop <app>
/restart <app>
/startapp <app>
/npminstall <app> <package>
`, { parse_mode: "Markdown" });
});

// === /status ===
bot.onText(/\/status/, async (msg) => {
  if (!isOwner(msg)) return;
  try {
    const out = await run("pm2 list");
    bot.sendMessage(msg.chat.id, "```" + out + "```", { parse_mode: "Markdown" });
  } catch (e) {
    bot.sendMessage(msg.chat.id, "❌ " + e);
  }
});

// === /stop <app> ===
bot.onText(/\/stop (.+)/, async (msg, [, app]) => {
  if (!isOwner(msg)) return;
  try {
    await run(`pm2 stop ${app}`);
    bot.sendMessage(msg.chat.id, `⛔ ${app} stopped`);
  } catch (e) {
    bot.sendMessage(msg.chat.id, "❌ " + e);
  }
});

// === /restart <app> ===
bot.onText(/\/restart (.+)/, async (msg, [, app]) => {
  if (!isOwner(msg)) return;
  try {
    await run(`pm2 restart ${app}`);
    bot.sendMessage(msg.chat.id, `🔄 ${app} restarted`);
  } catch (e) {
    bot.sendMessage(msg.chat.id, "❌ " + e);
  }
});

// === /startapp <app> ===
bot.onText(/\/startapp (.+)/, async (msg, [, app]) => {
  if (!isOwner(msg)) return;
  try {
    await run(`pm2 start ${app}`);
    bot.sendMessage(msg.chat.id, `▶️ ${app} started`);
  } catch (e) {
    bot.sendMessage(msg.chat.id, "❌ " + e);
  }
});

// === /npminstall <app> <package> ===
bot.onText(/\/npminstall (\S+) (\S+)/, async (msg, [, app, pkg]) => {
  if (!isOwner(msg)) return;

  try {
    const cmd = `cd ${app} && npm install ${pkg}`;
    await run(cmd);
    bot.sendMessage(msg.chat.id, `📦 Installed *${pkg}* in *${app}*`, {
      parse_mode: "Markdown"
    });
  } catch (e) {
    bot.sendMessage(msg.chat.id, "❌ " + e);
  }
});

console.log("🤖 PM2 Control Bot ONLINE");

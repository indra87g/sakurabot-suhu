const fs = require("fs");
const path = require("path");
const axios = require("axios");
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
const TelegramBot = require("node-telegram-bot-api");
const { exec } = require("child_process");

// === Init Bot ===
const bot = new TelegramBot(process.env.TOKEN, { polling: true });

// === Groups cache ===
let groupsJoined = new Set();

// === Utils: load/save groups ===
function loadGroups() {
  try {
    if (!fs.existsSync("./groups.json")) {
      fs.writeFileSync("./groups.json", "[]");
    }
    const raw = fs.readFileSync("./groups.json", "utf8");
    const data = JSON.parse(raw);
    groupsJoined = new Set(Array.isArray(data) ? data : []);
    console.log(`✅ Loaded ${groupsJoined.size} group(s) dari file.`);
  } catch (e) {
    console.error("⚠️ Error baca groups.json:", e.message);
    groupsJoined = new Set();
  }
}

function saveGroups() {
  try {
    fs.writeFileSync("./groups.json", JSON.stringify([...groupsJoined], null, 2));
    console.log(`💾 GB LIST (${groupsJoined.size} group).`);
  } catch (e) {
    console.error("⚠️ Error tulis groups.json:", e.message);
  }
}

// === Cek user premium (harus join channel) ===
async function isUserPremium(userId) {
  try {
    const member = await bot.getChatMember(process.env.CHANNEL_ID, userId);
    return ["member", "administrator", "creator"].includes(member.status);
  } catch (e) {
    return false;
  }
}

// === Kirim tombol Join ===
async function sendJoinButton(chatId) {
  return bot.sendMessage(
    chatId,
    "♥️ KAMU BELUM PREMIUM.",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📢 JOIN CHANNEL", url: process.env.PREMIUM_JOIN_LINK }],
          [{ text: "✅ SAYA SUDAH JOIN", callback_data: "check_join" }]
        ]
      }
    }
  );
}

// === Track group join (via message) ===
bot.on("message", (msg) => {
  if (msg.chat?.type === "group" || msg.chat?.type === "supergroup") {
    if (!groupsJoined.has(msg.chat.id)) {
      groupsJoined.add(msg.chat.id);
      saveGroups();
      console.log(`📌 NEW GB BOT: ${msg.chat.title} (${msg.chat.id})`);
    }
  }
});

// === Track bot kicked/left ===
bot.on("my_chat_member", (update) => {
  const chat = update.chat;
  const newStatus = update.new_chat_member?.status;
  if ((chat?.type === "group" || chat?.type === "supergroup") && newStatus === "left") {
    if (groupsJoined.has(chat.id)) {
      groupsJoined.delete(chat.id);
      saveGroups();
      console.log(`❌ BOT EXIT: ${chat.title} (${chat.id})`);
    }
  }
});

// === /start ===
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  const premium = await isUserPremium(userId);
  if (!premium) return sendJoinButton(chatId);

  const caption = `<blockquote>
╭──( 𝗕𝗢𝗧 𝗝𝗔𝗦𝗛𝗘𝗥 )──╮
│ ⋋──────────────⋌
│   HALO! AKU BOT 
    JASHER TWINIGHTWHEEL
│ ⋋──────────────⋌
╰──────────────────╯
╭──( 𝗦𝗧𝗔𝗧𝗨𝗦 𝗔𝗖𝗖𝗘𝗦 )──╮
│  ⋋──────────────⋌
│    𝚃𝙾𝚃𝙰𝙻 𝙶𝚁𝚄𝙱 : ${groupsJoined.size}
│    𝚂𝚃𝙰𝚃𝚄𝚂 𝙺𝙰𝙼𝚄 : ✅ PREMIUM
│  ⋋──────────────⋌
╰───────────────────╯
╭────( 𝗠𝗘𝗡𝗨 𝗕𝗢𝗧 )────╮
│  ⋋──────────────⋌
│    ╭▸ /share Reply Pesan
│    ╰▸ /start Lihat Menu
│    ╭▸ /getcode &lt;url&gt;
│    ╭▸ /chatowner &lt;pesan&gt;
│    ╰▸ /report @user 
│  ⋋──────────────⋌
╰───────────────────╯
</blockquote>`;

  await bot.sendPhoto(
    chatId,
    "https://i.postimg.cc/L67G55bc/74354841406a58efb32ceb89ebb73e08.jpg",
    {
      caption,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "OWNER", url: process.env.OWNER_LINK },
            { text: "DEVELOPER", url: process.env.DEV_LINK }
          ],
          [
            { text: "INFO OWNER", url: process.env.INFO_OWNER_LINK }
          ]
        ]
      }
    }
  );
});

// === /share (broadcast – copyMessage agar dukung semua tipe) ===
bot.onText(/\/share(?:@[\w_]+)?$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  const premium = await isUserPremium(userId);
  if (!premium) return sendJoinButton(chatId);

  if (!msg.reply_to_message) {
    return bot.sendMessage(chatId, "👉 REPLY PESAN YANG MAU DI /share");
  }

  const target = msg.reply_to_message;
  let success = 0, failed = 0;
  const statusMsg = await bot.sendMessage(chatId, `🔄 Proses ke ${groupsJoined.size} grup`);

  for (const groupId of groupsJoined) {
    try {
      await bot.copyMessage(groupId, chatId, target.message_id, {
        caption: target.caption || undefined
      });
      success++;
    } catch (e) {
      failed++;
      console.error(`❌ Gagal kirim ke ${groupId}:`, e.message);
    }
  }

  await bot.editMessageText(
    `📊 Done\n✅ SUKSES: ${success}\n❌ GAGAL: ${failed}`,
    { chat_id: chatId, message_id: statusMsg.message_id }
  );
});

// === Callback tombol "SAYA SUDAH JOIN" ===
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  if (callbackQuery.data === "check_join") {
    const premium = await isUserPremium(userId);
    if (premium) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "✅ Premium aktif!" });
      await bot.sendMessage(chatId, "♥️ BERHASIL MENDAPATKAN PREMIUM ♥️");
    } else {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Belum join channel" });
    }
  }
});

// === /chatowner <pesan> ===
bot.onText(/\/chatowner (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const fromUser = msg.from;
  const pesan = (match[1] || "").trim();

  if (!pesan) {
    return bot.sendMessage(chatId, "❌ CONTOH /chatowner hello");
  }

  try {
    await bot.sendMessage(
      OWNER_ID,
      `😎 *ADA PESAN BARU*\n\n` +
      `😂 NAME : ${fromUser.first_name} ${fromUser.last_name || ""}\n` +
      `⚕️ USER : @${fromUser.username || "-"}\n` +
      `🌒 ID : ${fromUser.id}\n\n` +
      `💬 PESAN :\n${pesan}`,
      { parse_mode: "Markdown" }
    );
    await bot.sendMessage(chatId, "✅ SUKSES kirim pesan ke owner");
  } catch (err) {
    console.error("ERROR KIRIM PESAN KE OWNER:", err.message);
    await bot.sendMessage(chatId, "❌ ERROR");
  }
});

// === /getcode <url> ===
bot.onText(/\/getcode (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  const premium = await isUserPremium(userId);
  if (!premium) return sendJoinButton(chatId);

  const url = (match[1] || "").trim();
  if (!/^https?:\/\//i.test(url)) {
    return bot.sendMessage(chatId, "♥️ /getcode https://namaweb");
  }

  try {
    const response = await axios.get(url, {
      responseType: "text",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Bot/1.0)" },
      timeout: 20000
    });
    const htmlContent = response.data;

    const filePath = path.join(__dirname, "web_source.html");
    fs.writeFileSync(filePath, htmlContent, "utf-8");

    await bot.sendDocument(chatId, filePath, {
      caption: `✅ CODE DARI ${url}`
    });

    fs.unlinkSync(filePath);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ ERROR SAAT MENGAMBIL CODE WEB");
  }
});

// === Anti-error wrapper untuk JS user ===
function addAntiError(code) {
  return `
(function(){
  try {
${indent(code, 4)}
  } catch (e) {
    console.error("Script Error:", e);
  }
})();
`;
}

function indent(str, spaces = 2) {
  const pad = " ".repeat(spaces);
  return String(str).split("\n").map(l => pad + l).join("\n");
}

// === Polling error logger ===
bot.on("polling_error", (err) => console.error("POLLING ERROR:", err?.message || err));

// === STARTUP ===
loadGroups();
console.log("\x1b[34m" + "Bot started!" + "\x1b[0m");

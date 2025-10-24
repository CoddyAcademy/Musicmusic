import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import express from "express";
import { exec } from "child_process";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

const TelegramToken = process.env.BOT_TOKEN || "8136690370:AAG3ywEPYHZ-P2uiwVHunGWsp9N78Iq0KLU";
const bot = new TelegramBot(TelegramToken, { polling: true });

const channels = ["@intention_academy", "@brown_blog"];

// === Obuna tekshirish ===
async function isSubscribed(userId) {
  try {
    for (const channel of channels) {
      const member = await bot.getChatMember(channel, userId);
      if (
        member.status !== "member" &&
        member.status !== "administrator" &&
        member.status !== "creator"
      ) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

// === Start komandasi ===
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📢 Kanal 1", url: `https://t.me/${channels[0].replace("@", "")}` },
          { text: "📢 Kanal 2", url: `https://t.me/${channels[1].replace("@", "")}` },
        ],
        [{ text: "✅ Obuna bo‘ldim", callback_data: "check_sub" }],
      ],
    },
  };
  bot.sendMessage(chatId, "👋 Salom! Quyidagi kanallarga obuna bo‘ling:", keyboard);
});

// === Callback ===
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  if (query.data === "check_sub") {
    const ok = await isSubscribed(userId);
    if (ok) {
      bot.sendMessage(chatId, "✅ Obuna tasdiqlandi! Endi menga video link yuboring.");
    } else {
      bot.sendMessage(chatId, "⚠️ Hali obuna bo‘lmagansiz!");
    }
  }
});

// === Linklarni qayta ishlash ===
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || text.startsWith("/")) return;

  const subscribed = await isSubscribed(msg.from.id);
  if (!subscribed)
    return bot.sendMessage(chatId, "⚠️ Iltimos, avval kanallarga obuna bo‘ling!");

  if (
    !text.includes("youtube.com") &&
    !text.includes("youtu.be") &&
    !text.includes("instagram.com") &&
    !text.includes("tiktok.com")
  )
    return bot.sendMessage(chatId, "❌ Faqat YouTube, Instagram yoki TikTok link yuboring!");

  bot.sendMessage(chatId, "🎬 Video yuklanmoqda, biroz kuting...");

  const fileName = `video_${Date.now()}.mp4`;
  const command = `yt-dlp --no-playlist --format mp4 --no-ffmpeg -o "${fileName}" "${text}"`;

  const child = exec(command);

  child.on("exit", async (code) => {
    if (code === 0 && fs.existsSync(fileName)) {
      try {
        await bot.sendVideo(chatId, fileName);
        fs.unlinkSync(fileName);
      } catch (e) {
        bot.sendMessage(chatId, "⚠️ Video yuborishda xato!");
      }
    } else {
      bot.sendMessage(chatId, "⚠️ Yuklab bo‘lmadi!");
    }
  });
});

// === Express health check ===
app.get("/", (req, res) => res.send("🤖 Bot sog‘lom ishlayapti!"));

app.listen(PORT, () => console.log(`✅ Server ${PORT}-portda ishlayapti`));

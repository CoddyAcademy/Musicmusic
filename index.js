import TelegramBot from "node-telegram-bot-api";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";

// Fayl yo‘li
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express server
const app = express();
const PORT = process.env.PORT || 3000;

// Telegram token
const TelegramToken = process.env.BOT_TOKEN || "8136690370:AAG3ywEPYHZ-P2uiwVHunGWsp9N78Iq0KLU";
const bot = new TelegramBot(TelegramToken, { polling: true });

// Ffmpeg yo‘li
const ffmpegPath = path.join(__dirname, "ffmpeg.exe");

// Kanallar
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
  } catch (err) {
    console.error("❌ Obuna tekshirishda xato:", err.message);
    return false;
  }
}

// === Start komandasi ===
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const options = {
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

  bot.sendMessage(chatId, "👋 Salom! Quyidagi kanallarga obuna bo‘ling:", options);
});

// === Callback ===
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;

  if (query.data === "check_sub") {
    const subscribed = await isSubscribed(userId);
    if (subscribed) {
      bot.sendMessage(chatId, "✅ Obuna tasdiqlandi! Endi menga video link yuboring.");
    } else {
      bot.sendMessage(chatId, "⚠️ Avval barcha kanallarga obuna bo‘ling!");
    }
  }
});

// === Link qabul qilish ===
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || text.startsWith("/")) return;

  const subscribed = await isSubscribed(msg.from.id);
  if (!subscribed) {
    return bot.sendMessage(chatId, "⚠️ Avval kanallarga obuna bo‘ling!");
  }

  if (
    !text.includes("youtube.com") &&
    !text.includes("youtu.be") &&
    !text.includes("instagram.com") &&
    !text.includes("reel") &&
    !text.includes("tiktok.com")
  ) {
    return bot.sendMessage(chatId, "❌ Faqat YouTube, Instagram yoki TikTok link yuboring!");
  }

  bot.sendMessage(chatId, "🎬 Video yuklanmoqda, biroz kuting...");

  const fileName = `video_${Date.now()}.mp4`;
  const command = `yt-dlp --no-playlist --format mp4 -o "${fileName}" "${text}"`;

  exec(command, async (error) => {
    if (error) {
      console.error("❌ Yuklash xatosi:", error.message);
      return bot.sendMessage(chatId, "⚠️ Yuklashda xatolik yuz berdi!");
    }

    try {
      if (fs.existsSync(fileName)) {
        await bot.sendVideo(chatId, fileName);
        fs.unlinkSync(fileName);
      } else {
        bot.sendMessage(chatId, "⚠️ Video fayl topilmadi!");
      }
    } catch (err) {
      console.error("Video yuborishda xato:", err.message);
      bot.sendMessage(chatId, "⚠️ Video yuborishda xato!");
    }
  });
});

// === Express health check ===
app.get("/", (req, res) => {
  res.send("🤖 Bot sog‘lom ishlayapti!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT}-portda ishlayapti`);
});

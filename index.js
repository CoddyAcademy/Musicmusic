import TelegramBot from "node-telegram-bot-api";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import express from "express";

// === Configlar ===
const app = express();
const PORT = process.env.PORT || 3000;

// Telegram tokenni env orqali oling (Koyeb uchun xavfsizroq)
const TelegramToken = process.env.BOT_TOKEN || "8136690370:AAG3ywEPYHZ-P2uiwVHunGWsp9N78Iq0KLU";
const bot = new TelegramBot(TelegramToken, { polling: true });

// ffmpeg joylashuvi
const ffmpegPath = path.join(process.cwd(), "ffmpeg.exe");

// Kanal ro‘yxati
const channels = ["@intention_academy", "@brown_blog"];

// === Obuna tekshirish funksiyasi ===
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
    console.error("❌ Obuna tekshirishda xato:", err);
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

  bot.sendMessage(
    chatId,
    "👋 Salom! Botdan foydalanish uchun quyidagi kanallarga obuna bo‘ling:",
    options
  );
});

// === Callback javob ===
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;

  if (query.data === "check_sub") {
    const subscribed = await isSubscribed(userId);
    if (subscribed) {
      bot.sendMessage(
        chatId,
        "✅ Obuna tasdiqlandi! Endi menga YouTube, Instagram yoki TikTok link yuboring."
      );
    } else {
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
      bot.sendMessage(chatId, "⚠️ Siz hali barcha kanallarga obuna bo‘lmagansiz!", options);
    }
  }
});

// === Linkni qayta ishlovchi ===
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || text.startsWith("/")) return;

  const subscribed = await isSubscribed(msg.from.id);
  if (!subscribed) {
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
    return bot.sendMessage(chatId, "⚠️ Iltimos, avval kanallarga obuna bo‘ling!", options);
  }

  // Link tekshiruvi
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
  const command = `yt-dlp.exe --no-playlist --format mp4 --ffmpeg-location "${ffmpegPath}" -o "${fileName}" "${text}"`;

  exec(command, async (error) => {
    if (error) {
      console.error("❌ Yuklash xatosi:", error);
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
      console.error("Video yuborishda xato:", err);
      bot.sendMessage(chatId, "⚠️ Video yuborishda xato!");
    }
  });
});

// === Express server (Koyeb uchun kerak) ===
app.get("/", (req, res) => {
  res.send("🤖 Bot sog‘lom ishlayapti!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT}-portda ishlayapti`);
});

console.log("🤖 Bot ishga tushdi (Koyeb + polling + obuna tekshirish)...");

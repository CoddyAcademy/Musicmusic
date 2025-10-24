const TelegramBot = require("node-telegram-bot-api");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const TelegramToken = "8136690370:AAG3ywEPYHZ-P2uiwVHunGWsp9N78Iq0KLU";
const bot = new TelegramBot(TelegramToken, { polling: true });

const ffmpegPath = path.join(__dirname, "ffmpeg.exe");


const channels = ["@intention_academy", "@brown_blog"];


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

      bot.sendMessage(
        chatId,
        "⚠️ Siz hali barcha kanallarga obuna bo'lmagansiz!",
        options
      );
    }
  }
});


bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;


  if (text.startsWith("/")) return;

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
    return bot.sendMessage(chatId, "⚠️ Iltimos, avval kanallarga obuna bo'ling!", options);
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

console.log("🤖 Bot ishga tushdi (node-telegram-bot-api + obuna tekshiruv)...");

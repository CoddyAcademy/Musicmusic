const { Telegraf } = require("telegraf");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const TelegramToken = "8062034936:AAGiExYSUBuy25M8_EalixEFW8Z5dJnehIU";
const bot = new Telegraf(TelegramToken);

const ffmpegPath = path.join(__dirname, "ffmpeg.exe");

bot.start((ctx) => ctx.reply("🎵 Menga YouTube, yoki Instagram, yoki Tik tok link yuboring"));

bot.on("text", async (ctx) => {
  const url = ctx.message.text.trim();

  if (!url.includes("youtube.com") && !url.includes("youtu.be") && !url.includes("instagram.com") && !url.includes("reel") && !url.includes("tiktok.com")){
    return ctx.reply("❌ Faqat YouTube, Instagram, Tiktok link yuboring!");
  }

  ctx.reply("🎧 Yuklanmoqda, biroz kuting...");

  const fileName = `audio_${Date.now()}.mp3`;
  const command = `yt-dlp.exe -x --no-playlist --audio-format mp3 --ffmpeg-location "${ffmpegPath}" -o "${fileName}" "${url}"`;

  exec(command, async (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Xatolik:", error);
      return ctx.reply("⚠️ Yuklashda xatolik yuz berdi!");
    }

    try {
      if (fs.existsSync(fileName)) {
        await ctx.replyWithAudio({ source: fileName });
        fs.unlinkSync(fileName);
      } else {
        ctx.reply("⚠️ Audio fayl topilmadi!");
      }
    } catch (err) {
      console.error("Audio yuborishda xato:", err);
      ctx.reply("⚠️ Audio yuborishda xato!");
    }
  });
});

bot.launch();
console.log("🤖 Bot ishga tushdi...");

const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "groupinfo",
    aliases: ["boxinfo", "gcinfo", "info"],
    version: "4.0",
    author: "SIFU",
    countDown: 5,
    role: 0,
    category: "Group Chat",
    guide: {
      en: "{p}groupinfo",
    },
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const { 
        threadName, participantIDs, messageCount, 
        emoji, adminIDs, approvalMode, 
        imageSrc, threadTheme 
      } = threadInfo;

      // Stylish Font Converter
      const stylize = (str) => {
        const map = {
          'a': '𝖺', 'b': '𝖻', 'c': '𝖼', 'd': '𝖽', 'e': '𝖾', 'f': '𝖿', 'g': '𝗀', 'h': '𝗁', 'i': '𝗂', 'j': '𝗃', 'k': '𝗄', 'l': '𝗅', 'm': '𝗆', 'n': '𝗇', 'o': '𝗈', 'p': '𝗉', 'q': '𝗊', 'r': '𝗋', 's': '𝗌', 't': '𝗍', 'u': '𝗎', 'v': '𝗏', 'w': '𝗐', 'x': '𝗑', 'y': '𝗒', 'z': '𝗓',
          'A': '𝖠', 'B': '𝖡', 'C': '𝖢', 'D': '𝖣', 'E': '𝖤', 'F': '𝖥', 'G': '𝖦', 'H': '𝖧', 'I': '𝖨', 'J': '𝖩', 'K': '𝖪', 'L': '𝖫', 'M': '𝖬', 'N': '𝖭', 'O': '𝖮', 'P': '𝖯', 'Q': '𝖰', 'R': '𝖱', 'S': '𝖲', 'T': '𝖳', 'U': '𝖴', 'V': '𝖵', 'W': '𝖶', 'X': '𝖷', 'Y': '𝖸', 'Z': '𝖹',
          '0': '０', '1': '１', '2': '２', '3': '３', '4': '４', '5': '５', '6': '６', '7': '７', '8': '８', '9': '９'
        };
        return str ? str.toString().split('').map(char => map[char] || char).join('') : "𝖭/𝖠";
      };

      const memCount = participantIDs.length;
      let maleCount = 0, femaleCount = 0;

      for (const user of threadInfo.userInfo) {
        if (user.gender === "MALE") maleCount++;
        else if (user.gender === "FEMALE") femaleCount++;
      }

      const adminNames = [];
      for (const admin of adminIDs) {
        try {
          const info = await api.getUserInfo(admin.id);
          adminNames.push(info[admin.id].name);
        } catch (e) { adminNames.push("𝖴𝗇𝗄𝗇𝗈𝗐𝗇 𝖠𝖽𝗆𝗂𝗇"); }
      }

      // Theme Info Extraction
      const themeName = threadTheme ? threadTheme.name : "𝖣𝖾𝖿𝖺𝗎𝗅𝗍 𝖡𝗅𝗎𝖾";
      
      let msg = `┏━━━━𝖦𝖢 𝖠𝖭𝖠𝖫𝖸𝖳𝖨𝖢𝖲━━━━┓\n\n`;
      
      msg += `🏷️ ${stylize("Name")}:\n ${threadName || "No Name"}\n`;
      msg += `🆔 ${stylize("Thread ID")}:\n ${threadID}\n`;
      msg += `🌈 ${stylize("Theme")}:\n ${stylize(themeName)}\n`;
      msg += `🎨 ${stylize("Emoji")}:\n ${emoji || "👍"}\n`;
      
      msg += `\n🥏 ${stylize("STATISTICS")}\n`;
      msg += `━━━━━━━━━━━━━━━━━━━\n`;
      msg += `👥 ${stylize("Total Members")}: ${stylize(memCount)}\n`;
      msg += `   ├──👨 ${stylize("Male")}: ${stylize(maleCount)}\n`;
      msg += `   └──👩 ${stylize("Female")}: ${stylize(femaleCount)}\n`;
      msg += `📩 ${stylize("Total Messages")}: ${stylize(messageCount.toLocaleString())}\n`;
      
      msg += `\n🛡️ ${stylize("SECURITY & ACCESS")}\n`;
      msg += `━━━━━━━━━━━━━━━━━━━\n`;
      msg += `🔒 ${stylize("Approval Mode")}: ${approvalMode ? "✅ 𝖠𝖼𝗍𝗂𝗏𝖾" : "❌ 𝖣𝗂𝗌𝖺𝖻𝗅𝖾𝖽"}\n`;
      msg += `👑 ${stylize("Admins")}: [ ${stylize(adminIDs.length)} ]\n`;
      msg += adminNames.map(name => `   └─⚡ ${name}`).join("\n");
      
      msg += `\n┗━━━━━━━━━━━━━━━━━━┛\n`;
      msg += `🍓 ${stylize("POWDER BY SIFU 🍓")}`;

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const cachePath = path.join(cacheDir, `group_${threadID}.png`);

      if (imageSrc) {
        const res = await axios.get(imageSrc, { responseType: "arraybuffer" });
        await fs.outputFile(cachePath, Buffer.from(res.data));
        
        api.sendMessage({
          body: msg,
          attachment: fs.createReadStream(cachePath)
        }, threadID, () => { if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath); }, messageID);
      } else {
        api.sendMessage(msg, threadID, messageID);
      }

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ 𝖤𝗋𝗋𝗈𝗋 𝖿𝖾𝗍𝖼𝗁𝗂𝗇𝗀 𝗀𝗋𝗈𝗎𝗉 𝖺𝗇𝖺𝗅𝗒𝗍𝗂𝖼𝗌.", threadID, messageID);
    }
  },
};

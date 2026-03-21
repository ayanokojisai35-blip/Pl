const fs = require("fs");
const path = require("path");

const { getPrefix } = global.utils;
const { commands, aliases } = global.noobCore;

const CATEGORY_PER_PAGE = 10;
const frames = ["🫐","🍏","🍈","🍇","🥑","🍐","🍒"];

const mediaFolder = path.join(__dirname, "..", "help.gife");

// RANDOM MEDIA
function getRandomHelpMedia() {
  try {
    const files = fs.readdirSync(mediaFolder);
    const media = files.filter(f =>
      [".gif",".mp4",".jpg",".png",".jpeg"]
      .includes(path.extname(f).toLowerCase())
    );
    if (!media.length) return null;
    const file = media[Math.floor(Math.random() * media.length)];
    return fs.createReadStream(path.join(mediaFolder, file));
  } catch {
    return null;
  }
}

// CHUNK
function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size)
    result.push(arr.slice(i, i + size));
  return result;
}

module.exports = {
  config: {
    name: "help",
    aliases: ["menu"],
    version: "14.0",
    author: "NoobCore Team - ayanokoji",
    role: 0,
    shortDescription: "Show all commands",
    guide: {
      en: [
        "{pn} → list commands by page",
        "{pn} <page> → open specific page",
        "{pn} <command> → command details",
        "{pn} all → show all commands"
      ].join("\n")
    }
  },

  onStart: async function({ message, args, event, role, api }) {

    const prefix = getPrefix(event.threadID);

    const categoryMap = {};

    // COLLECT COMMANDS
    for (const [name, cmd] of commands) {
      if (!cmd?.config) continue;

      const cmdRole = cmd.config.role || 0;
      if (cmdRole > role) continue;

      const category = (cmd.config.category || "general").toLowerCase();

      if (!categoryMap[category])
        categoryMap[category] = [];

      categoryMap[category].push({
        name,
        premium: cmd.config.premium || false
      });
    }

    const categories = Object.keys(categoryMap).sort();

    // HELP ALL
    if (args[0] === "all") {
      let msg = `🍈 Lelouch vi Britannia,s TOOL 🍈\n\n`;

      for (const cat of categories) {
        msg += `🫐 ${cat.toUpperCase()}\n`;

        for (const cmd of categoryMap[cat]) {
          msg += `${cmd.premium ? "💎" : "."} ${cmd.name} `;
        }

        msg += "\n\n";
      }

      msg += `Total Commands: ${commands.size}`;

      return message.reply({
        body: msg,
        attachment: getRandomHelpMedia()
      });
    }

    // COMMAND DETAILS
    if (args[0] && isNaN(args[0])) {
      const query = args[0].toLowerCase();

      let cmd = commands.get(query);
      if (!cmd && aliases.has(query))
        cmd = commands.get(aliases.get(query));

      if (!cmd)
        return message.reply("❌ Command not found.");

      const cfg = cmd.config;

      let guide = cfg.guide || "No guide available.";
      if (typeof guide === "object")
        guide = guide.en || Object.values(guide)[0] || "";

      if (Array.isArray(guide))
        guide = guide.join("\n");

      guide = String(guide).replace(/{pn}/g, prefix + cfg.name);

      const msg =
`🍈 Lelouch vi Britannia, s TOOL 🍈

🫐 Name: ${prefix}${cfg.name}
🍏 Author: ${cfg.author || "Unknown"}
🍈 Version: ${cfg.version || "1.0"}
🍇 Role: ${cfg.role || 0}
🥑 Cooldown: ${cfg.countDown || 5}s
🍐 Category: ${cfg.category || "general"}
🍒 Premium: ${cfg.premium ? "Yes 💎" : "No"}

📜 Usage:
${guide}`;

      return message.reply({
        body: msg,
        attachment: getRandomHelpMedia()
      });
    }

    // PAGE SYSTEM
    const pages = chunkArray(categories, CATEGORY_PER_PAGE);
    const totalPages = pages.length;

    let page = parseInt(args[0]) || 1;
    if (page < 1) page = 1;
    if (page > totalPages) page = 1;

    const currentCategories = pages[page - 1];

    function build(frame) {
      let msg =
`${frame} AYANOKOJI KIYOTAKA'S PERFECT TOOL ${frame}
━━━━━━━━━━━━━━━━━━
🍇 BOT HELP MENU
Page ${page}/${totalPages}
━━━━━━━━━━━━━━━━━━
`;

      for (const cat of currentCategories) {
        msg += `\n🫐 ${cat.toUpperCase()}\n`;

        for (const cmd of categoryMap[cat]) {
          msg += `${cmd.premium ? "💎" : "."} ${cmd.name} `;
        }

        msg += "\n";
      }

      msg += `
━━━━━━━━━━━━━━━━━━
🍏 Total Commands: ${commands.size}
🍈 Use: ${prefix}help <command>
🍇 View All: ${prefix}help all
━━━━━━━━━━━━━━━━━━
${frame} AYANOKOJI KIYOTAKA'S PERFECT TOOL ${frame}
`;

      return msg;
    }

    const sent = await message.reply({
      body: build("🥑"),
      attachment: getRandomHelpMedia()
    });

    // ANIMATION
    let i = 0;
    setInterval(() => {
      try {
        const emoji = frames[i % frames.length];
        api.editMessage(build(emoji), sent.messageID);
        i++;
      } catch {}
    }, 2000);
  }
}; 

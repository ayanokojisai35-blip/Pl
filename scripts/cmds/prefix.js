const fs = require("fs-extra");
const path = require("path");

const mediaFolder = path.join(__dirname, "..", "prefix.gife");

function getRandomPrefixMedia() {
  try {
    if (!fs.existsSync(mediaFolder)) return null;
    const files = fs.readdirSync(mediaFolder);
    const media = files.filter(f =>
      [".gif", ".mp4", ".jpg", ".png", ".jpeg"]
        .includes(path.extname(f).toLowerCase())
    );
    if (!media.length) return null;
    const file = media[Math.floor(Math.random() * media.length)];
    return fs.createReadStream(path.join(mediaFolder, file));
  } catch {
    return null;
  }
}

async function sendPrefix(message, event, threadsData) {
  const globalPrefix = global.noobCore.ncsetting.prefix;
  const threadPrefix =
    (await threadsData.get(event.threadID, "data.prefix")) || globalPrefix;

  const text =
`╭━━[ Perfect Tool ]━━╮
┃🀄 System: ${globalPrefix}
┃💬 Your Box: ${threadPrefix}
╰━━━━━━━━━━━━━╯`;

  return message.reply({
    body: text,
    attachment: getRandomPrefixMedia()
  });
}

module.exports = {
  config: {
    name: "prefix",
    version: "6.0",
    author: "NC",
    role: 0,
    countDown: 5
  },

  onStart: async function ({ message, event, args, role, threadsData, commandName }) {
    const body = event.body?.toLowerCase().trim();
    if (body === "prefix") return;

    if (!args[0]) {
      return sendPrefix(message, event, threadsData);
    }

    const newPrefix = args[0];
    const isGlobal = args[1] === "-g";

    if (isGlobal && role < 2) {
      return message.reply("❌ Admin only.");
    }

    return message.reply(
`⚙️ Confirm Prefix Change

Current: ${global.noobCore.ncsetting.prefix}
New: ${newPrefix}

React to confirm ✅`,
      (err, info) => {
        if (err) return;

        global.noobCore.ncReaction.set(info.messageID, {
          commandName,
          author: event.senderID,
          newPrefix,
          isGlobal,
          threadID: event.threadID
        });
      }
    );
  },

  ncReaction: async function ({ event, Reaction, message, threadsData }) {
    const { author, newPrefix, isGlobal, threadID } = Reaction;

    if (event.userID !== author) return;

    if (isGlobal) {
      global.noobCore.ncsetting.prefix = newPrefix;
      const configPath =
        global.client.dirConfig || path.join(process.cwd(), "config.json");

      fs.writeFileSync(
        configPath,
        JSON.stringify(global.noobCore.ncsetting, null, 2)
      );

      return message.reply(`✅ Global prefix changed to: ${newPrefix}`);
    }

    await threadsData.set(threadID, newPrefix, "data.prefix");
    return message.reply(`✅ Chat prefix changed to: ${newPrefix}`);
  },

  ncPrefix: async function ({ event, message, threadsData }) {
    const body = event.body?.toLowerCase().trim();
    if (body !== "prefix") return;
    return sendPrefix(message, event, threadsData);
  }
}; 

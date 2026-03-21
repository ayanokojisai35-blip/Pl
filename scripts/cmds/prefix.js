const fs = require("fs-extra");
const path = require("path");

let currentMediaIndex = 0;

module.exports = {
 config: {
 name: "prefix",
 version: "1.6",
 author: "NTKhang + Modified by Rex + Sequential Media by ChatGPT",
 countDown: 5,
 role: 0,
 description: "Change bot's command prefix",
 category: "config",
 guide: {
 en: "{pn} <new prefix>: Change prefix in current box\n{pn} <new prefix> -g: Change system prefix\n{pn} reset: Reset box prefix to default"
 }
 },

 langs: {
 en: {
 reset: "✅ Prefix reset to default: %1",
 onlyAdmin: "⚠️ Only bot admin can change the global prefix.",
 confirmGlobal: "🛡 React to confirm global prefix change.",
 confirmThisThread: "🛡 React to confirm box prefix change.",
 successGlobal: "✅ Global prefix updated to: %1",
 successThisThread: "✅ This group's prefix updated to: %1",
 myPrefix: "╭━━[ PREFIX INFO ]━━╮\n┃🌐 System: %1\n┃💬 Your Box: %2\n╰━━━━━━━━━━━━━━╯"
 }
 },

 onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
 if (!args[0]) return message.SyntaxError();

 if (args[0] == "reset") {
 await threadsData.set(event.threadID, null, "data.prefix");
 return sendWithMedia(message, getLang("reset", global.GoatBot.config.prefix));
 }

 const newPrefix = args[0];
 const formSet = {
 commandName,
 author: event.senderID,
 newPrefix
 };

 if (args[1] === "-g") {
 if (role < 2) return message.reply(getLang("onlyAdmin"));
 formSet.setGlobal = true;
 } else formSet.setGlobal = false;

 return message.reply(args[1] === "-g" ? getLang("confirmGlobal") : getLang("confirmThisThread"), async (err, info) => {
 formSet.messageID = info.messageID;
 global.GoatBot.onReaction.set(info.messageID, formSet);
 });
 },

 onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
 const { author, newPrefix, setGlobal } = Reaction;
 if (event.userID !== author) return;

 if (setGlobal) {
 global.GoatBot.config.prefix = newPrefix;
 fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
 return sendWithMedia(message, getLang("successGlobal", newPrefix));
 } else {
 await threadsData.set(event.threadID, newPrefix, "data.prefix");
 return sendWithMedia(message, getLang("successThisThread", newPrefix));
 }
 },

 onChat: async function ({ event, message, usersData, getLang }) {
 const data = await usersData.get(event.senderID);
 if (event.body && event.body.toLowerCase() === "prefix") {
 const body = getLang("myPrefix", global.GoatBot.config.prefix, global.utils.getPrefix(event.threadID));
 return sendWithMedia(message, body);
 }
 }
};

// ✅ Helper function to send text with media from local folder in SERIAL order
async function sendWithMedia(message, body) {
 const mediaDir = path.join(__dirname, "prefix.gife");

 try {
 const files = fs.readdirSync(mediaDir).filter(f =>
 f.endsWith(".mp4") || f.endsWith(".webm") ||
 f.endsWith(".gif") || f.endsWith(".jpg") ||
 f.endsWith(".jpeg") || f.endsWith(".png")
 );

 if (files.length === 0) return message.reply(body);

 const selected = files[currentMediaIndex];
 currentMediaIndex = (currentMediaIndex + 1) % files.length; // Loop back when reaching the end

 return message.reply({
 body,
 attachment: fs.createReadStream(path.join(mediaDir, selected))
 });
 } catch (err) {
 console.error("Media send failed:", err);
 return message.reply(body);
 }
}

const fs = require("fs-extra");
const path = require("path");
const { getPrefix } = global.utils;
const { commands } = global.GoatBot;

const localMediaFolder = path.join(__dirname, "help.gife");

module.exports = {
 config: {
 name: "help",
 aliases: ["menu", "use"],
 version: "5.3",
 author: "Ayanokōji Kiyotaka (Refined by Siyam)",
 countDown: 5,
 role: 0,
 shortDescription: { en: "Elegant command navigator" },
 longDescription: { en: "Minimal, aesthetic help menu with smart navigation." },
 category: "info",
 guide: { en: "{pn} [page | command | all]" }
 },

 onStart: async function ({ api, event, args, message, threadsData }) {
 const { threadID } = event;
 const prefix = getPrefix(threadID) || "*";
 const ownerTag = "Ayanokōji Kiyotaka";

 // Categorize commands
 const categorized = {};
 for (const cmd of commands.values()) {
 if (cmd.config.hide) continue;
 const cat = (cmd.config.category || "Unsorted").toUpperCase();
 if (!categorized[cat]) categorized[cat] = [];
 categorized[cat].push(cmd);
 }

 const sortedCats = Object.keys(categorized).sort();
 sortedCats.forEach(cat =>
 categorized[cat].sort((a, b) => a.config.name.localeCompare(b.config.name))
 );

 // Full list
 if (args[0]?.toLowerCase() === "all") {
 let text = "🌸 Complete Command List 🌸\n";
 for (const cat of sortedCats) {
 const cmds = categorized[cat].map(c => `• ${c.config.name}`).join(" ");
 text += `\n🍒 ${cat}\n${cmds}\n`;
 }
 return message.reply(text);
 }

 // Single command details
 if (args.length && isNaN(args[0]) && args[0] !== "-c") {
 const query = args[0].toLowerCase();
 const cmd = commands.get(query) || [...commands.values()].find(c => c.config.aliases?.includes(query));
 if (!cmd) return message.reply(`🍇 Command "${args[0]}" not found.`);

 const guide = typeof cmd.config.guide === "object" ? cmd.config.guide.en : cmd.config.guide || "No guide available.";
 const shortDesc = typeof cmd.config.shortDescription === "object" ? cmd.config.shortDescription.en : cmd.config.shortDescription || "N/A";
 const longDesc = typeof cmd.config.longDescription === "object" ? cmd.config.longDescription.en : cmd.config.longDescription || "N/A";

 return message.reply(
 `🫐 Command: ${cmd.config.name}\n\n` +
 `🎀 Author: ${cmd.config.author || "Unknown"}\n` +
 `🌸 Role Level: ${cmd.config.role}\n` +
 `🍒 Short Description:\n${shortDesc}\n\n` +
 `🫐 Full Description:\n${longDesc}\n\n` +
 `🍇 Usage:\n${guide}`
 );
 }

 // Page-wise menu
 const pageSize = 8;
 const pages = [];
 for (let i = 0; i < sortedCats.length; i += pageSize) {
 const chunk = sortedCats.slice(i, i + pageSize);
 let section = "";
 for (const cat of chunk) {
 const cmds = categorized[cat].map(c => `• ${c.config.name}`).join(" ");
 section += `\n🫐 ${cat}\n${cmds}\n`;
 }
 pages.push(section);
 }

 const totalPages = pages.length;
 let pageNum = parseInt(args[0]) || 1;
 if (pageNum < 1 || pageNum > totalPages) pageNum = 1;

 // Clean frame styles
 const buildFrame = (content, type) => {
 switch (type) {
 case 0:
 return `🌸 ${ownerTag}\n\n${content}\n🫐 Smart Menu`;
 case 1:
 return `🫐 Smart Menu\n\n${content}\n🌸 ${ownerTag}`;
 case 2:
 return `🍒 ${ownerTag}\n\n${content}\n🫐 Smart Menu`;
 default:
 return `🫐 Smart Menu\n\n${content}\n🍇 ${ownerTag}`;
 }
 };

 // Load media
 let media = null;
 try {
 const files = await fs.readdir(localMediaFolder);
 const validMedia = files.filter(f =>
 [".gif", ".mp4", ".jpg", ".jpeg", ".png"].includes(path.extname(f).toLowerCase())
 );
 if (validMedia.length) {
 const selected = validMedia[Math.floor(Math.random() * validMedia.length)];
 media = fs.createReadStream(path.join(localMediaFolder, selected));
 }
 } catch (e) {
 console.warn("⚠️ Media folder issue:", e.message);
 }

 const msg = await message.reply({
 body: `🌸 Loading page ${pageNum} of ${totalPages}...`,
 attachment: media
 });

 // Soft animated edit
 let frameStep = 0;
 const animate = async () => {
 const content = `🍒 Page ${pageNum} of ${totalPages}\n${pages[pageNum - 1]}`;
 const display = buildFrame(content, frameStep % 4);
 try {
 await api.editMessage(display, msg.messageID);
 frameStep++;
 setTimeout(animate, 1800);
 } catch (_) {}
 };
 animate();
 }
};
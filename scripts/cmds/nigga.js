const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
 config: {
 name: "nigga",
 aliases: [],
 version: "2.0",
 author: "SiFu",
 countDown: 2,
 role: 0,
 shortDescription: "Send roast image",
 longDescription: "Roast by mention, reply, UID or self",
 category: "fun",
 guide: {
 en: `{pn} @mention
{pn} (reply to a message)
{pn} <uid>
{pn} (no input = self roast)`
 }
 },

 onStart: async function ({ api, event, args }) {
 let targetUID;

 try {
 // 1️⃣ Mention
 if (event.mentions && Object.keys(event.mentions).length > 0) {
 targetUID = Object.keys(event.mentions)[0];
 }

 // 2️⃣ Reply
 else if (event.messageReply) {
 targetUID = event.messageReply.senderID;
 }

 // 3️⃣ UID argument
 else if (args[0] && /^\d+$/.test(args[0])) {
 targetUID = args[0];
 }

 // 4️⃣ Self
 else {
 targetUID = event.senderID;
 }

 const cacheDir = path.join(__dirname, "cache");
 if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

 const imgPath = path.join(cacheDir, `roast_${targetUID}.jpg`);

 const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/nigga?userid=${targetUID}`;
 const res = await axios.get(apiUrl, { responseType: "arraybuffer" });

 fs.writeFileSync(imgPath, Buffer.from(res.data));

 api.sendMessage(
 {
 body: "🐳 Look I found a nigga 😂",
 attachment: fs.createReadStream(imgPath)
 },
 event.threadID,
 () => {
 if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
 },
 event.messageID
 );

 } catch (err) {
 console.error("ROAST CMD ERROR:", err);
 api.sendMessage(
 "❌ Image generate করতে সমস্যা হচ্ছে। পরে আবার চেষ্টা কর।",
 event.threadID,
 event.messageID
 );
 }
 }
};
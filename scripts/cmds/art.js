const axios = require("axios");
const fs = require("fs-extra");
const FormData = require("form-data");
const path = require("path");

module.exports = {
 config: {
 name: "art",
 version: "1.0",
 author: "🔰𝐑𝐀𝐇𝐀𝐓 𝐈𝐒𝐋𝐀𝐌🔰 (Converted by Siyam)",
 countDown: 5,
 role: 0,
 shortDescription: "AI Anime Art Style",
 longDescription: "Reply to an image to convert it into anime style using AI",
 category: "editing",
 guide: "{pn} (reply to an image)"
 },

 onStart: async function ({ api, event, message }) {
 const { messageReply } = event;

 if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
 return message.reply("❌ অনুগ্রহ করে কোনো একটি ছবির রিপ্লাই দিন।");
 }

 const imageUrl = messageReply.attachments[0].url;
 const cachePath = path.join(__dirname, "cache", `art_${Date.now()}.jpg`);

 try {
 // Ensure cache folder exists
 await fs.ensureDir(path.join(__dirname, "cache"));

 // Download image
 const response = await axios.get(imageUrl, {
 responseType: "arraybuffer"
 });

 await fs.writeFile(cachePath, response.data);

 // Prepare form data
 const form = new FormData();
 form.append("image", fs.createReadStream(cachePath));

 // Send to API
 const apiRes = await axios.post(
 "https://art-api-97wn.onrender.com/artify?style=anime",
 form,
 {
 headers: form.getHeaders(),
 responseType: "arraybuffer"
 }
 );

 await fs.writeFile(cachePath, apiRes.data);

 await message.reply({
 body: "✅ AI artify করা হয়েছে!",
 attachment: fs.createReadStream(cachePath)
 });

 fs.unlinkSync(cachePath);

 } catch (error) {
 console.error(error);
 return message.reply("❌ কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।");
 }
 }
};
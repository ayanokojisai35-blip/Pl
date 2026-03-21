
const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
 config: {
 name: "neko",
 version: "1.0.0",
 author: "SIFU",
 cooldown: 5,
 role: 0,
 category: "anime",
 shortDescription: "Send a cute neko image",
 longDescription: "Fetches an image .",
 },

 onStart: async function ({ api, event, args }) {
 const { threadID, messageID } = event;
 const tmpDir = path.join(__dirname, "cache");
 if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

 const filename = `neko_${threadID}_${Date.now()}.jpg`;
 const filepath = path.join(tmpDir, filename);
 const url = "https://mahbub-ullash.cyberbot.top/api/neko";

 try {
 // Request image as arraybuffer then write to file
 const res = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });

 // Basic validation of content-type (image)
 const ct = res.headers["content-type"] || "";
 if (!ct.startsWith("image/")) {
 // If API returns JSON or error, try to parse and show message
 let text = "Failed to fetch image from API.";
 try {
 const textBody = Buffer.from(res.data).toString("utf8");
 const parsed = JSON.parse(textBody);
 if (parsed && parsed.message) text = `API error: ${parsed.message}`;
 else text = `Unexpected response from API (content-type: ${ct}).`;
 } catch (err) {
 text = `Unexpected response from API (content-type: ${ct}).`;
 }
 return api.sendMessage(text, threadID, messageID);
 }

 fs.writeFileSync(filepath, Buffer.from(res.data), { encoding: "binary" });

 // Send message with attachment
 const msg = {
 body: "Here you go — neko! 🐱",
 attachment: fs.createReadStream(filepath),
 };
 await api.sendMessage(msg, threadID, messageID);
 } catch (error) {
 console.error("neko command error:", error);
 let errMsg = "Could not fetch neko image. Try again later.";
 if (error.code === "ECONNABORTED") errMsg = " Request timed out.";
 await api.sendMessage(errMsg, threadID, messageID);
 } finally {
 // cleanup temp file if exists
 try {
 if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
 } catch (e) {
 // ignore cleanup errors
 }
 }
 },
};
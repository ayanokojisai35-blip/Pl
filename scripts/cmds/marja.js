const axios = require("axios");

module.exports = {
 config: {
 name: "marja",
 version: "1.0",
 author: "RAFI",
 shortDescription: { en: "Send profile picture then voice separately" },
 longDescription: { en: "First sends HD profile picture, then voice message separately" },
 category: "fun",
 guide: { en: "{pn} <userID>" },
 role: 0
 },

 onStart: async function ({ api, event }) {
 // Target user: mention থাকলে mention, reply থাকলে reply sender, না হলে sender
 const targetID = event.mentions && Object.keys(event.mentions)[0]
 ? Object.keys(event.mentions)[0]
 : event.messageReply
 ? event.messageReply.senderID
 : event.senderID;

 try {
 // API call
 const apiResp = await axios.get(`https://marja-api.onrender.com/marja?id=${targetID}`);
 const { profile, voice } = apiResp.data;

 // Profile Picture পাঠানো (reply নয়, সরাসরি thread-এ)
 await api.sendMessage({
 body: "",
 attachment: await global.utils.getStreamFromURL(profile)
 }, event.threadID);

 // Optional delay, যাতে Facebook restriction কম হয়
 await new Promise(resolve => setTimeout(resolve, 500));

 // Voice পাঠানো (reply নয়)
 await api.sendMessage({
 body: "",
 attachment: await global.utils.getStreamFromURL(voice)
 }, event.threadID);

 } catch (error) {
 console.error("MARJA CMD ERROR:", error.message || error);
 await api.sendMessage("❌ Failed to fetch profile or voice. Try again.", event.threadID);
 }
 }
};
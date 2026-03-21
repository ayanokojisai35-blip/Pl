const fs = require("fs");
const path = require("path");
const dataPath = path.join(__dirname, "autoreaddData.json");

if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}));

module.exports = {
 config: {
 name: "autoreadd",
 aliases: ["ad"],
 version: "2.1",
 author: "Siyam",
 role: 2,
 shortDescription: "Auto re-add ON/OFF",
 longDescription: "Automatically re-adds users who leave or are kicked. Supports ON/OFF per group.",
 category: "system",
 guide: {
 en: "Use: ad on | ad off"
 }
 },

 onStart: async function ({ api, event, args }) {
 const { threadID } = event;
 const data = JSON.parse(fs.readFileSync(dataPath));

 if (!args[0]) {
 return api.sendMessage("⚙️ Use: ad on | ad off", threadID);
 }

 if (args[0].toLowerCase() === "on") {
 data[threadID] = true;
 fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
 return api.sendMessage("✅ Auto re-add চালু করা হয়েছে!", threadID);
 }

 if (args[0].toLowerCase() === "off") {
 data[threadID] = false;
 fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
 return api.sendMessage("❌ Auto re-add বন্ধ করা হয়েছে!", threadID);
 }

 return api.sendMessage("⚠️ ভুল ব্যবহার! লিখো: ad on | ad off", threadID);
 },

 onEvent: async function ({ api, event }) {
 const { logMessageType, logMessageData, threadID } = event;
 if (logMessageType !== "log:unsubscribe") return;

 const data = JSON.parse(fs.readFileSync(dataPath));
 if (!data[threadID]) return;

 const leftUserID = logMessageData.leftParticipantFbId;
 if (leftUserID === api.getCurrentUserID()) return;

 try {
 const threadInfo = await api.getThreadInfo(threadID);
 const botID = api.getCurrentUserID();
 const isBotAdmin = threadInfo.adminIDs.some(a => a.id === botID);

 if (isBotAdmin) {
 await api.addUserToGroup(leftUserID, threadID);
 } else {
 await api.addUserToGroup(leftUserID, threadID); // approval/invite
 }
 } catch (err) {
 console.error("Auto re-add failed:", err.message);
 }
 }
};
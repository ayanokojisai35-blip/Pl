const axios = require("axios");

module.exports = {
 config: {
 name: "spy",
 aliases: ["whoishe", "whoisshe", "whoami", "stalk"],
 version: "2.0",
 role: 0,
 author: "xnil6x",
 description: "Get detailed user information with elegant presentation",
 category: "information",
 countDown: 5,
 },
 
 onStart: async function({ event, message, usersData, api, args }) {
 const uid1 = event.senderID;
 const uid2 = Object.keys(event.mentions)[0];
 let uid;
 
 if (args[0]) {
 if (/^\d+$/.test(args[0])) {
 uid = args[0];
 } else {
 const match = args[0].match(/profile\.php\?id=(\d+)/);
 if (match) uid = match[1];
 }
 }
 
 uid = uid || (event.type === "message_reply" ? event.messageReply.senderID : uid2 || uid1);
 
 try {
 const [userInfo, avatarUrl, userData, allUsers] = await Promise.all([
 api.getUserInfo(uid),
 usersData.getAvatarUrl(uid),
 usersData.get(uid),
 usersData.getAll()
 ]);
 
 const genderMap = {
 1: "♀️ Girl",
 2: "♂️ Boy",
 undefined: "🌈 Custom"
 };
 
 const formatMoney = num => {
 if (isNaN(num)) return "0";
 const units = ["", "K", "M", "B", "T"];
 let unit = 0;
 while (num >= 1000 && unit < units.length - 1) {
 num /= 1000;
 unit++;
 }
 return num.toFixed(1).replace(/\.0$/, "") + units[unit];
 };
 
 const getRank = (id, key) => {
 const sorted = [...allUsers].sort((a, b) => b[key] - a[key]);
 return sorted.findIndex(u => u.userID === id) + 1;
 };
 
 const info = userInfo[uid];
 const stats = {
 money: userData.money || 0,
 exp: userData.exp || 0,
 rank: getRank(uid, 'exp'),
 moneyRank: getRank(uid, 'money')
 };
 
 const createBox = (title, items) => {
 let box = `╭─── ✦ ${title} ✦ ───\n`;
 items.forEach(([key, value]) => {
 box += `├─ ${key}: ${value}\n`;
 });
 box += `╰────────────────`;
 return box;
 };
 
 const profileBox = createBox("PROFILE", [
 ["🎭 Name", info.name],
 ["🧬 Gender", genderMap[info.gender] || "Unknown"],
 ["🆔 UID", uid],
 ["👑 Status", info.type?.toUpperCase() || "Regular User"],
 ["🏷️ Username", info.vanity || "None"],
 ["🎂 Birthday", info.isBirthday || "Private"],
 ["💫 Nickname", info.alternateName || "None"],
 ["🤖 Bot Friend", info.isFriend ? "✅ Yes" : "❌ No"]
 ]);
 
 const statsBox = createBox("STATISTICS", [
 ["💰 Money", `$${formatMoney(stats.money)}`],
 ["⭐ Experience", stats.exp],
 ["🏆 Rank", `#${stats.rank}/${allUsers.length}`],
 ["💎 Wealth Rank", `#${stats.moneyRank}/${allUsers.length}`]
 ]);
 
 const profileUrl = `🌐 Profile: ${info.profileUrl}`;
 
 await message.reply({
 body: `${profileBox}\n\n${statsBox}\n\n${profileUrl}`,
 attachment: await global.utils.getStreamFromURL(avatarUrl)
 });
 
 } catch (error) {
 console.error("Spy Command Error:", error);
 message.reply("🔍 Couldn't spy on this user. They might be wearing an invisibility cloak!");
 }
 }
};
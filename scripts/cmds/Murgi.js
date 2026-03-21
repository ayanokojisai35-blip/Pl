module.exports = {
 config: {
 name: "murgi",
 version: "1.0.1",
 author: "ayanokoji (fixed by helper)",
 countDown: 10,
 role: 2,
 description: {
 en: "Start a war in the chat with aggressive messages directed at a tagged user or replied user."
 },
 category: "chat fun",
 guide: {
 en: "Tag a user or reply to their message: {pn} @username\nOr just reply to a message and type {pn}"
 }
 },

 onStart: async function ({ api, event, args, message }) {
 let targetID = null;
 let targetName = null;
 let arraytag = [];

 // Case 1: Mention (@) আছে
 if (event.mentions && Object.keys(event.mentions).length > 0) {
 targetID = Object.keys(event.mentions)[0];
 targetName = event.mentions[targetID];
 }
 // Case 2: Mention নেই, কিন্তু reply আছে
 else if (event.messageReply) {
 targetID = event.messageReply.senderID;
 try {
 const userInfo = await api.getUserInfo(targetID);
 targetName = userInfo[targetID]?.name || "ওই খাংকি";
 } catch (err) {
 targetName = "ওইটা";
 console.log("User info fetch error:", err);
 }
 }

 // Mention বা reply কোনোটাই না পেলে error
 if (!targetID) {
 return api.sendMessage(
 "বস যে মেয়েকে চুদতে চাও সে মেয়েকে @ম্যানশন দাও বা তার কোনো মেসেজে reply দিয়ে কমান্ড দাও",
 event.threadID,
 event.messageID
 );
 }

 arraytag.push({ id: targetID, tag: targetName });

 // Send function shortcut (string বা object দুটোই হ্যান্ডেল করে)
 const send = (content) => {
 if (typeof content === "string") {
 api.sendMessage(content, event.threadID, event.messageID);
 } else {
 api.sendMessage(content, event.threadID, event.messageID);
 }
 };

 // প্রথম মেসেজ (normal text)
 send("ayanokoji এর চুদা লো মাগি");

 // বাকি মেসেজগুলো setTimeout দিয়ে
 setTimeout(() => send({ body: "খাংকির মেয়ে তর মারে চুদি 🥰। " + targetName, mentions: arraytag }), 3000);
 setTimeout(() => send({ body: "খাংকির মেয়ে তর কচি বোন রে চুদি 😍.. " + targetName, mentions: arraytag }), 5000);
 setTimeout(() => send({ body: "মাদারচোদ তর আম্মু পম পম খাংকির পো 🐰 " + targetName, mentions: arraytag }), 7000);
 setTimeout(() => send({ body: "খাংকির মেয়ে তর কচি ভুদায় ভুদায় কামর দিমু 💔! " + targetName, mentions: arraytag }), 9000);
 setTimeout(() => send({ body: "খাংকি মাগির মেয়ে কথা ক কম কম তর আম্মু রে চুদে বানামু আইটেম বোম " + targetName, mentions: arraytag }), 12000);
 setTimeout(() => send({ body: "depression থেকেও তর মাইরে চু*** দি 🤬 " + targetName, mentions: arraytag }), 15000);
 setTimeout(() => send({ body: "তর আম্মু রে আচার এর লোভ দেখি চুদি মাগির মেয়ে🤬 " + targetName, mentions: arraytag }), 17000);
 setTimeout(() => send({ body: "বান্দির মেয়ে তর কচি বোনের ভুদা ফাক কর থুতু দিয়ে ভুদায় দন ডুকামু 🤟 " + targetName, mentions: arraytag }), 20000);
 setTimeout(() => send({ body: "বান্দি মাগির মেয়ে তর আম্মু রে চুদি তর দুলা ভাই এর কান্দে ফেলে 🤝 " + targetName, mentions: arraytag }), 23000);
 setTimeout(() => send({ body: "উফফফ খাদ্দামা মাগির মেয়ে তর আম্মুর কালা ভুদায় আমার মাল আউট তর কচি বোন রে উপ্তা করে এবার চুদবো 💉। " + targetName, mentions: arraytag }), 25000);
 setTimeout(() => send({ body: "অনলাইনে গালি বাজ হয়ে গেছত মাগির মেয়ে এমন চুদা দিমু লাইফ টাইম মনে রাখভি ayanokoji তর বাপ মাগির মেয়ে 😘। " + targetName, mentions: arraytag }), 28500);
 setTimeout(() => send({ body: "বাতিজা শুন তর আম্মু রে চুদলে রাগ করবি না তো আচ্ছা জা রাগ করিস না তর আম্মুর কালা ভুদায় আর চুদলাম না তো বোন এর জামা টা খুলে দে ✋ " + targetName, mentions: arraytag }), 31000);
 setTimeout(() => send({ body: "হাই মাদারচোদ তর তর ব্যাশা জাতের আম্মু টা রে আদর করে করে চুদি " + targetName, mentions: arraytag }), 36000);
 setTimeout(() => send("\~ চুদা কি আরো খাবি মাগির পোল 🤖"), 39000);
 setTimeout(() => send({ body: "খাংকির মেয়ে 🥰। " + targetName, mentions: arraytag }), 42000);
 setTimeout(() => send({ body: "মাদারচোদ😍.. " + targetName, mentions: arraytag }), 48000);
 setTimeout(() => send({ body: "ব্যাস্যার মেয়ে 🐰 " + targetName, mentions: arraytag }), 51000);
 setTimeout(() => send({ body: "ব্যাশ্যা মাগির মেয়ে 💔! " + targetName, mentions: arraytag }), 54000);
 setTimeout(() => send({ body: "পতিতা মাগির মেয়ে " + targetName, mentions: arraytag }), 57000);
 setTimeout(() => send({ body: "depression থেকেও তর মাইরে চু*** দি 🤬 " + targetName, mentions: arraytag }), 59400);
 setTimeout(() => send({ body: "তর মারে চুদি " + targetName, mentions: arraytag }), 63000);
 setTimeout(() => send({ body: "নাট বল্টু মাগির মেয়ে🤟 " + targetName, mentions: arraytag }), 66000);
 setTimeout(() => send({ body: "তর বোন রে পায়জামা খুলে চুদি 🤣 " + targetName, mentions: arraytag }), 69000);
 setTimeout(() => send({ body: "উম্মম্মা তর বোন এরকচি ভুদায়💉। " + targetName, mentions: arraytag }), 72000);
 setTimeout(() => send({ body: "DNA টেষ্ট করা দেখবি আমার চুদা তেই তর জন্ম। " + targetName, mentions: arraytag }), 75000);
 setTimeout(() => send({ body: "কামলা মাগির মেয়ে ✋ " + targetName, mentions: arraytag }), 81000);
 setTimeout(() => send({ body: " বাস্ট্রাড এর বাচ্ছা বস্তির মেয়ে " + targetName, mentions: arraytag }), 87000);
 setTimeout(() => send("\~ আমার জারজ শন্তান🤖"), 93000);
 setTimeout(() => send({ body: "Welcome মাগির মেয়ে 🥰। " + targetName, mentions: arraytag }), 99000);
 setTimeout(() => send({ body: "তর কচি বোন এর পম পম😍.. " + targetName, mentions: arraytag }), 105000);
 setTimeout(() => send({ body: "ব্যাস্যার মেয়ে কথা শুন তর আম্মু রে চুদি গামছা পেচিয়ে🐰 " + targetName, mentions: arraytag }), 111000);
 setTimeout(() => send({ body: "Hi ayanokoji এর জারজ মাগির মেয়ে 💔! " + targetName, mentions: arraytag }), 114000);
 setTimeout(() => send({ body: "২০ টাকা এ পতিতা মাগির মেয়ে " + targetName, mentions: arraytag }), 120000);

 // বাকি মেসেজগুলো যদি আরো লাগে তাহলে এভাবে চালিয়ে যেতে পারো...
 // শেষের দিকে কয়েকটা রিপিট ছিল, সেগুলো কমিয়ে দিলাম যাতে spam না হয় বেশি।
 }
};
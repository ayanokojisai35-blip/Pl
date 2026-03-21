const axios = require("axios");

module.exports = {
 config: {
 name: "apitest",
 version: "1.0",
 author: "xnil6x",
 role: 4,
 usePrefix: false,
 description: "Test any public API via GET or POST",
 guide: "/apitest get <url> | /apitest post <url> <body>",
 category: "utility",
 cooldowns: 3
 },

 onStart: async function ({ api, event, args }) {
 const method = args[0]?.toLowerCase();
 const url = args[1];
 const bodyInput = args.slice(2).join(" ");

 if (!method || !url) {
 return api.sendMessage("Usage:\n/apitest get <url>\n/apitest post <url> <json-body>", event.threadID, event.messageID);
 }

 try {
 let res;
 if (method === "get") {
 res = await axios.get(url);
 } else if (method === "post") {
 let data = {};
 try {
 data = bodyInput ? JSON.parse(bodyInput) : {};
 } catch (e) {
 return api.sendMessage("Invalid JSON body for POST request.", event.threadID, event.messageID);
 }
 res = await axios.post(url, data);
 } else {
 return api.sendMessage("Only GET and POST methods are supported.", event.threadID, event.messageID);
 }

 const reply = JSON.stringify(res.data, null, 2);
 return api.sendMessage(reply.length > 19000 ? "Response too long." : reply, event.threadID, event.messageID);
 } catch (err) {
 return api.sendMessage("Error: " + (err.response?.data?.message || err.message), event.threadID, event.messageID);
 }
 }
};
const config = global.config;
const prefix = config.prefix || "*"; // your configured prefix
const isAdmin = config.adminBot.includes(event.senderID);

// Message must start with prefix unless user is admin
if (!body.startsWith(prefix)) {
  if (!isAdmin) return; // Public user without prefix -> no response
  else {
    // Admin using command without prefix
    const splitBody = body.trim().split(/\s+/);
    const commandName = splitBody[0].toLowerCase();
    const args = splitBody.slice(1);

    // Check if command exists
    const command = global.client.commands.get(commandName);
    if (!command) return;

    try {
      command.run({ api, event, args, client: global.client });
    } catch (e) {
      console.error(e);
    }
    return;
  }
}

// If message has prefix, process as usual
const splitBody = body.slice(prefix.length).trim().split(/\s+/);
const commandName = splitBody[0].toLowerCase();
const args = splitBody.slice(1);
const command = global.client.commands.get(commandName);
if (!command) return;

try {
  command.run({ api, event, args, client: global.client });
} catch (e) {
  console.error(e);
}

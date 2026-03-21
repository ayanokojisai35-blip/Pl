const fs = require("fs-extra");
const nullAndUndefined = [undefined, null];
// const { config } = global.GoatBot; // const { utils } = global;

function getType(obj) { return Object.prototype.toString.call(obj).slice(8, -1); }

function getRole(threadData, senderID) {
    const adminBot = global.GoatBot.config.adminBot || [];
    const premium = global.GoatBot.config.premium || [];
    if (!senderID) return 0;
    const adminBox = threadData ? threadData.adminIDs || [] : [];
    return premium.includes(senderID) ? 3 : adminBot.includes(senderID) ? 2 : adminBox.includes(senderID) ? 1 : 0;
}

function getText(type, reason, time, targetID, lang) {
    const utils = global.utils;
    if (type == "userBanned") return utils.getText({ lang, head: "handlerEvents" }, "userBanned", reason, time, targetID);
    else if (type == "threadBanned") return utils.getText({ lang, head: "handlerEvents" }, "threadBanned", reason, time, targetID);
    else if (type == "onlyAdminBox") return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBox");
    else if (type == "onlyAdminBot") return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBot");
}

function replaceShortcutInLang(text, prefix, commandName) {
    // Correcting the template literal syntax
    return text
        .replace(/{(?:p|prefix)}/g, prefix)
        .replace(/{(?:n|name)}/g, commandName)
        .replace(/{pn}/g, `${prefix}${commandName}`);
}

function getRoleConfig(utils, command, isGroup, threadData, commandName) {
    let roleConfig;
    if (utils.isNumber(command.config.role)) {
        roleConfig = { onStart: command.config.role };
    } else if (typeof command.config.role == "object" && !Array.isArray(command.config.role)) {
        if (!command.config.role.onStart) command.config.role.onStart = 0;
        roleConfig = command.config.role;
    } else {
        roleConfig = { onStart: 0 };
    }

    if (isGroup)
        roleConfig.onStart = threadData.data.setRole?.[commandName] ?? roleConfig.onStart;

    for (const key of ["onChat", "onStart", "onReaction", "onReply"]) {
        if (roleConfig[key] == undefined)
            roleConfig[key] = roleConfig.onStart;
    }

    return roleConfig;
    // {
    // 	onChat,
    // 	onStart,
    // 	onReaction,
    // 	onReply
    // }

}

function isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, lang) {
    const config = global.GoatBot.config;
    const { adminBot, hideNotiMessage } = config;

    // check if user banned
    const infoBannedUser = userData.banned;
    if (infoBannedUser.status == true) {
        const { reason, date } = infoBannedUser;
        if (hideNotiMessage.userBanned == false)
            message.reply(getText("userBanned", reason, date, senderID, lang));
        return true;
    }

    // check if only admin bot
    if (
        config.adminOnly.enable == true
        && !adminBot.includes(senderID)
        && !config.adminOnly.ignoreCommand.includes(commandName)
    ) {
        if (hideNotiMessage.adminOnly == false)
            message.reply(getText("onlyAdminBot", null, null, null, lang));
        return true;
    }

    // ==========    Check Thread    ========== //
    if (isGroup == true) {
        if (
            threadData.data.onlyAdminBox === true
            && !threadData.adminIDs.includes(senderID)
            && !(threadData.data.ignoreCommanToOnlyAdminBox || []).includes(commandName)
        ) {
            // check if only admin box
            if (!threadData.data.hideNotiMessageOnlyAdminBox)
                message.reply(getText("onlyAdminBox", null, null, null, lang));
            return true;
        }

        // check if thread banned
        const infoBannedThread = threadData.banned;
        if (infoBannedThread.status == true) {
            const { reason, date } = infoBannedThread;
            if (hideNotiMessage.threadBanned == false)
                message.reply(getText("threadBanned", reason, date, threadID, lang));
            return true;
        }
    }
    return false;

}

function createGetText2(langCode, pathCustomLang, prefix, command) {
    const commandType = command.config.countDown ? "command" : "command event";
    const commandName = command.config.name;
    let customLang = {};
    let getText2 = () => { };
    if (fs.existsSync(pathCustomLang)) {
        try {
             const langData = require(pathCustomLang);
             customLang = langData[commandName]?.text || {};
        } catch (e) {
             // Ignore errors loading language files, maybe log later
             console.error(`Error loading language file ${pathCustomLang} for command ${commandName}:`, e);
             customLang = {}; // Ensure customLang is empty on error
        }
    }


    if (command.langs?.[langCode] || Object.keys(customLang).length > 0) { // Check if either has lang data
         getText2 = function (key, ...args) {
             let lang = command.langs?.[langCode]?.[key] || customLang[key] || "";
             lang = replaceShortcutInLang(lang, prefix, commandName);
             // Correctly replace {1}, {2}, etc.
             for (let i = args.length - 1; i >= 0; i--) {
                 lang = lang.replace(new RegExp(`%${i + 1}`, "g"), args[i]);
             }
             // Fallback message if text is empty
             return lang || `❌ Can't find text on language "${langCode}" for ${commandType} "${commandName}" with key "${key}"`;
         };
    } else {
         // Provide a fallback getText2 if no lang data exists
         getText2 = function (key, ...args) {
              let fallbackText = `❌ Can't find text on language "${langCode}" for ${commandType} "${commandName}" with key "${key}"`;
              // Optionally, incorporate args into a generic message if needed
              // e.g., fallbackText += ` (args: ${args.join(', ')})`;
              return fallbackText;
         };
    }
    return getText2;
}

module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
    return async function (event, message) {

        const { utils, client, GoatBot } = global;
        const { getPrefix, removeHomeDir, log, getTime } = utils;
        const { config, configCommands: { envGlobal, envCommands, envEvents } } = GoatBot;
        const { autoRefreshThreadInfoFirstTime } = config.database;
        let { hideNotiMessage = {} } = config;

        const { body, messageID, threadID, isGroup } = event;

        // Check if has threadID
        if (!threadID)
            return;

        const senderID = event.userID || event.senderID || event.author;

        let threadData = global.db.allThreadData.find(t => t.threadID == threadID);
        let userData = global.db.allUserData.find(u => u.userID == senderID);

        if (!userData && !isNaN(senderID))
            userData = await usersData.create(senderID);

        if (!threadData && !isNaN(threadID)) {
            if (global.temp.createThreadDataError.includes(threadID))
                return;
            threadData = await threadsData.create(threadID);
            global.db.receivedTheFirstMessage[threadID] = true;
        }
        else {
            if (
                autoRefreshThreadInfoFirstTime === true
                && !global.db.receivedTheFirstMessage[threadID]
            ) {
                global.db.receivedTheFirstMessage[threadID] = true;
                await threadsData.refreshInfo(threadID);
            }
        }

        if (typeof threadData.settings.hideNotiMessage == "object")
            hideNotiMessage = threadData.settings.hideNotiMessage;

        const prefix = getPrefix(threadID);
        const role = getRole(threadData, senderID);
        const parameters = {
            api, usersData, threadsData, message, event,
            userModel, threadModel, prefix, dashBoardModel,
            globalModel, dashBoardData, globalData, envCommands,
            envEvents, envGlobal, role,
            removeCommandNameFromBody: function removeCommandNameFromBody(body_, prefix_, commandName_) {
                if ([body_, prefix_, commandName_].every(x => nullAndUndefined.includes(x)))
                    // Original comment seems wrong here, it should provide args if called without
                    // Or throw a specific error indicating it only works implicitly inside onStart call
                    // Let's stick to the original check structure for minimal change
                    throw new Error("Please provide body, prefix and commandName to use this function");

                for (let i = 0; i < arguments.length; i++)
                    if (typeof arguments[i] != "string")
                        throw new Error(`The parameter "${i + 1}" must be a string, but got "${getType(arguments[i])}"`);

                return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
            }
        };
        const langCode = threadData.data.lang || config.language || "en";

        function createMessageSyntaxError(commandName) {
            message.SyntaxError = async function () {
                return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "commandSyntaxError", prefix, commandName));
            };
        }

        /*
            +-----------------------------------------------+
            |                            WHEN CALL COMMAND                                |
            +-----------------------------------------------+
        */
        let isUserCallCommand = false;
        async function onStart() {
            // —————————————— CHECK USE BOT —————————————— //
            const adminBotList = global.GoatBot.config.adminBot || []; // Get the list of bot admins
            // MODIFICATION START
            // Only proceed if the message body exists AND (starts with the prefix OR the sender is a bot admin)
            if (!body || (!body.startsWith(prefix) && !adminBotList.includes(senderID))) {
                // If the user is not a bot admin and didn't use the prefix, or if the body is empty,
                // we stop processing this as a command call via onStart.
                return;
            }
            // MODIFICATION END

            const dateNow = Date.now();
            // If we reach here, it means either prefix was used OR sender is a bot admin.
            // For admins using without prefix, args need to be split directly from body.
            // For others, args split from body after prefix.
            let args;
            let commandName;
            let command;

            if (body.startsWith(prefix)) {
                 args = body.slice(prefix.length).trim().split(/ +/);
                 commandName = args.shift().toLowerCase();
            } else { // Admin using without prefix
                 args = body.trim().split(/ +/);
                 commandName = args.shift().toLowerCase();
            }

            // ————————————  CHECK HAS COMMAND ——————————— //
            command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));

            // ———————— CHECK ALIASES SET BY GROUP ———————— //
            const aliasesData = threadData.data.aliases || {};
            for (const cmdName in aliasesData) {
                if (aliasesData[cmdName].includes(commandName)) {
                    command = GoatBot.commands.get(cmdName);
                    break;
                }
            }
            // ————————————— SET COMMAND NAME ————————————— //
            if (command)
                commandName = command.config.name;

            // ——————— FUNCTION REMOVE COMMAND NAME ———————— //
            // This function needs to handle the case where prefix might not be present for admins
            function removeCommandNameFromBody(body_, prefix_, commandName_) {
                 if (arguments.length < 3) {
                      // If called without args inside onStart, use the current scope variables
                      return body.replace(new RegExp(`^(?:${prefix}|)(\\s+|)${commandName}`, "i"), "").trim();
                 }
                 // If called with args, assume it's being used explicitly and handle prefix removal
                 // Need to check if prefix is actually present in body_ to decide whether to remove it.
                 // Or, more simply, remove the commandName potentially preceded by the prefix OR just the commandName
                 // The regex `^(?:${prefix_}|)` matches the prefix non-capturingly or nothing at the start.
                 return body_.replace(new RegExp(`^(?:${prefix_}|)(\\s+|)${commandName_}`, "i"), "").trim();
            }


            // —————  CHECK BANNED OR ONLY ADMIN BOX  ————— //
            if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
                return;

            if (!command) {
                // Only show commandNotFound message if the user is NOT an admin OR they used a prefix
                // This prevents admins from getting "command not found" for random non-command messages without prefix
                if ((!adminBotList.includes(senderID) || body.startsWith(prefix)) && !hideNotiMessage.commandNotFound)
                    return await message.reply(
                        commandName ?
                            utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound", commandName, prefix) :
                            utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound2", prefix)
                    );
                else
                     return true; // Don't send message but stop processing
            }

            // ————————————— CHECK PERMISSION ———————————— //
            const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
            const needRole = roleConfig.onStart;

            if (needRole > role) {
                if (!hideNotiMessage.needRoleToUseCmd) {
                    if (needRole == 1)
                        return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdmin", commandName));
                    else if (needRole == 2)
                        return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2", commandName));
                    else if (needRole == 3)
                        return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyPremium", commandName));
                }
                else {
                    return true;
                }
            }
            // ———————————————— countDown ———————————————— //
            if (!client.countDown[commandName])
                client.countDown[commandName] = {};
            const timestamps = client.countDown[commandName];
            let getCoolDown = command.config.countDown;
            if (!getCoolDown && getCoolDown != 0 || isNaN(getCoolDown))
                getCoolDown = 1;
            const cooldownCommand = getCoolDown * 1000;
            if (timestamps[senderID]) {
                const expirationTime = timestamps[senderID] + cooldownCommand;
                if (dateNow < expirationTime)
                    return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "waitingForCommand", ((expirationTime - dateNow) / 1000).toString().slice(0, 3)));
            }
            // ——————————————— RUN COMMAND ——————————————— //
            const time = getTime("DD/MM/YYYY HH:mm:ss");
            isUserCallCommand = true;
            try {
                // analytics command call
                (async () => {
                    const analytics = await globalData.get("analytics", "data", {});
                    if (!analytics[commandName])
                        analytics[commandName] = 0;
                    analytics[commandName]++;
                    await globalData.set("analytics", analytics, "data");
                })();

                createMessageSyntaxError(commandName);
                const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
                await command.onStart({
                    ...parameters,
                    args,
                    commandName,
                    getLang: getText2,
                    removeCommandNameFromBody // Pass the correctly scoped function
                });
                timestamps[senderID] = dateNow;
                log.info("CALL COMMAND", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
            }
            catch (err) {
                log.err("CALL COMMAND", `An error occurred when calling the command ${commandName}`, err);
                return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
            }
        }


        /*
         +------------------------------------------------+
         |                    ON CHAT                     |
         +------------------------------------------------+
        */
        async function onChat() {
            const allOnChat = GoatBot.onChat || [];
            const args = body ? body.split(/ +/) : [];
            for (const key of allOnChat) {
                const command = GoatBot.commands.get(key);
                if (!command)
                    continue;
                const commandName = command.config.name;

                // —————————————— CHECK PERMISSION —————————————— //
                const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
                const needRole = roleConfig.onChat;
                if (needRole > role)
                    continue;

                const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
                const time = getTime("DD/MM/YYYY HH:mm:ss");
                createMessageSyntaxError(commandName);

                if (getType(command.onChat) == "Function") {
                    const defaultOnChat = command.onChat;
                    // convert to AsyncFunction
                    command.onChat = async function () {
                        return defaultOnChat(...arguments);
                    };
                }

                command.onChat({
                    ...parameters,
                    isUserCallCommand,
                    args,
                    commandName,
                    getLang: getText2
                })
                    .then(async (handler) => {
                        if (typeof handler == "function") {
                            if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
                                return;
                            try {
                                await handler();
                                log.info("onChat", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
                            }
                            catch (err) {
                                await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred2", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
                            }
                        }
                    })
                    .catch(err => {
                        log.err("onChat", `An error occurred when calling the command onChat ${commandName}`, err);
                    });
            }
        }


        /*
         +------------------------------------------------+
         |                   ON ANY EVENT                 |
         +------------------------------------------------+
        */
        async function onAnyEvent() {
            const allOnAnyEvent = GoatBot.onAnyEvent || [];
            let args = [];
            // Adjusting args parsing here for onAnyEvent as well for consistency,
            // allowing admins to use non-prefix triggers for events too.
            const adminBotList = global.GoatBot.config.adminBot || [];
            if (typeof event.body == "string") {
                 if (event.body.startsWith(prefix)) {
                      args = event.body.split(/ +/);
                 } else if (adminBotList.includes(senderID)) {
                      args = event.body.split(/ +/);
                 }
            }


            for (const key of allOnAnyEvent) {
                if (typeof key !== "string")
                    continue;
                const command = GoatBot.commands.get(key);
                if (!command)
                    continue;
                const commandName = command.config.name;
                const time = getTime("DD/MM/YYYY HH:mm:ss");
                createMessageSyntaxError(commandName);

                const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command);

                if (getType(command.onAnyEvent) == "Function") {
                    const defaultOnAnyEvent = command.onAnyEvent;
                    // convert to AsyncFunction
                    command.onAnyEvent = async function () {
                        return defaultOnAnyEvent(...arguments);
                    };
                }

                command.onAnyEvent({
                    ...parameters,
                    args, // Pass potentially non-prefix args for admins
                    commandName,
                    getLang: getText2
                })
                    .then(async (handler) => {
                        if (typeof handler == "function") {
                            try {
                                await handler();
                                log.info("onAnyEvent", `${commandName} | ${senderID} | ${userData.name} | ${threadID}`);
                            }
                            catch (err) {
                                message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred7", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
                                log.err("onAnyEvent", `An error occurred when calling the command onAnyEvent ${commandName}`, err);
                            }
                        }
                    })
                    .catch(err => {
                        log.err("onAnyEvent", `An error occurred when calling the command onAnyEvent ${commandName}`, err);
                    });
            }
        }

        /*
         +------------------------------------------------+
         |                  ON FIRST CHAT                 |
         +------------------------------------------------+
        */
        async function onFirstChat() {
            const allOnFirstChat = GoatBot.onFirstChat || [];
            const args = body ? body.split(/ +/) : []; // onFirstChat doesn't typically use prefix, so args split from full body

            for (const itemOnFirstChat of allOnFirstChat) {
                const { commandName, threadIDsChattedFirstTime } = itemOnFirstChat;
                if (threadIDsChattedFirstTime.includes(threadID))
                    continue;
                const command = GoatBot.commands.get(commandName);
                if (!command)
                    continue;

                itemOnFirstChat.threadIDsChattedFirstTime.push(threadID); // Mark thread as having chatted first time BEFORE calling handler

                // Check isBannedOrOnlyAdmin BEFORE calling handler
                // onFirstChat might behave differently regarding bans/adminOnly depending on command logic,
                // but standard check is reasonable default.
                 if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode)) {
                      // If banned/only admin, remove from chatted first time list so it can run later
                      const index = itemOnFirstChat.threadIDsChattedFirstTime.indexOf(threadID);
                      if (index > -1) {
                           itemOnFirstChat.threadIDsChattedFirstTime.splice(index, 1);
                      }
                      continue; // Don't run onFirstChat handler if banned/only admin applies
                 }


                const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
                const time = getTime("DD/MM/YYYY HH:mm:ss");
                createMessageSyntaxError(commandName);

                if (getType(command.onFirstChat) == "Function") {
                    const defaultOnFirstChat = command.onFirstChat;
                    // convert to AsyncFunction
                    command.onFirstChat = async function () {
                        return defaultOnFirstChat(...arguments);
                    };
                }

                command.onFirstChat({
                    ...parameters,
                    isUserCallCommand,
                    args,
                    commandName,
                    getLang: getText2
                })
                    .then(async (handler) => {
                        if (typeof handler == "function") {
                            // isBannedOrOnlyAdmin check already done above, maybe re-check inside handler?
                            // The original check is sufficient if it's done before calling the handler.
                            try {
                                await handler();
                                log.info("onFirstChat", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
                            }
                            catch (err) {
                                await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred2", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
                            }
                        }
                    })
                    .catch(err => {
                        log.err("onFirstChat", `An error occurred when calling the command onFirstChat ${commandName}`, err);
                        // If error occurs, perhaps remove from chattedFirstTime list so it can retry?
                        // Depends on desired behavior. Leaving as is for now.
                    });
            }
        }


        /*
         +------------------------------------------------+
         |                    ON REPLY                    |
         +------------------------------------------------+
        */
        async function onReply() {
            if (!event.messageReply)
                return;
            const { onReply } = GoatBot;
            const Reply = onReply.get(event.messageReply.messageID);
            if (!Reply)
                return;
            Reply.delete = () => onReply.delete(event.messageReply.messageID); // Use original messageID to delete
            const commandName = Reply.commandName;
            if (!commandName) {
                message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommandName"));
                return log.err("onReply", `Can't find command name to execute this reply!`, Reply);
            }
            const command = GoatBot.commands.get(commandName);
            if (!command) {
                message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommand", commandName));
                return log.err("onReply", `Command "${commandName}" not found`, Reply);
            }

            // —————————————— CHECK PERMISSION —————————————— //
            const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
            const needRole = roleConfig.onReply;
            if (needRole > role) {
                if (!hideNotiMessage.needRoleToUseCmdOnReply) {
                    if (needRole == 1)
                        return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminToUseOnReply", commandName));
                    else if (needRole == 2)
                        return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2ToUseOnReply", commandName));
                    else if (needRole == 3)
                         return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyPremiumToUseOnReply", commandName)); // Added premium
                }
                else {
                    return true;
                }
            }

            const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
            const time = getTime("DD/MM/YYYY HH:mm:ss");
            try {
                if (!command)
                    throw new Error(`Cannot find command with commandName: ${commandName}`);
                const args = body ? body.split(/ +/) : [];
                createMessageSyntaxError(commandName);
                // Check ban/adminOnly before running reply handler
                if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
                     return;

                await command.onReply({
                    ...parameters,
                    Reply,
                    args,
                    commandName,
                    getLang: getText2
                });
                log.info("onReply", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
            }
            catch (err) {
                log.err("onReply", `An error occurred when calling the command onReply ${commandName}`, err);
                await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred3", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
            }
        }


        /*
         +------------------------------------------------+
         |                   ON REACTION                  |
         +------------------------------------------------+
        */
        async function onReaction() {
            if (!event.reaction) // Ensure it's a reaction event
                 return;

            const { onReaction } = GoatBot;
            // Reaction event's messageID is the ID of the message being reacted *to*
            const Reaction = onReaction.get(messageID);
            if (!Reaction)
                return;

            Reaction.delete = () => onReaction.delete(messageID);
            const commandName = Reaction.commandName;
            if (!commandName) {
                // No message reply here, as it's a reaction, just log
                return log.err("onReaction", `Can't find command name to execute this reaction!`, Reaction);
            }
            const command = GoatBot.commands.get(commandName);
            if (!command) {
                 // No message reply here, just log
                 return log.err("onReaction", `Command "${commandName}" not found`, Reaction);
            }

            // —————————————— CHECK PERMISSION —————————————— //
            const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
            const needRole = roleConfig.onReaction;
            if (needRole > role) {
                if (!hideNotiMessage.needRoleToUseCmdOnReaction) {
                    if (needRole == 1)
                        // Message reply for permission check
                        return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminToUseOnReaction", commandName));
                    else if (needRole == 2)
                        // Message reply for permission check
                        return await message.reply(utils.getText({ lang: langCode, head: "onlyAdminBot2ToUseOnReaction" }, "onlyAdminBot2ToUseOnReaction", commandName)); // Adjusted head
                    else if (needRole == 3)
                        // Message reply for premium permission
                        return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyPremiumToUseOnReaction", commandName)); // Added premium
                }
                else {
                    return true; // Don't send message but block
                }
            }
            // —————————————————————————————————————————————— //

            const time = getTime("DD/MM/YYYY HH:mm:ss");
            try {
                if (!command)
                    throw new Error(`Cannot find command with commandName: ${commandName}`);
                const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
                const args = []; // Reactions don't typically have args in the body
                createMessageSyntaxError(commandName);
                // Check ban/adminOnly before running reaction handler
                if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
                    return;

                await command.onReaction({
                    ...parameters,
                    Reaction,
                    args,
                    commandName,
                    getLang: getText2,
                     userID: event.userID // Add the reactor's ID specifically for reaction event
                });
                log.info("onReaction", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${event.reaction}`);
            }
            catch (err) {
                log.err("onReaction", `An error occurred when calling the command onReaction ${commandName}`, err);
                // Message reply for errors
                await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred4", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
            }
        }


        /*
         +------------------------------------------------+
         |                 EVENT COMMAND                  |
         +------------------------------------------------+
        */
        async function handlerEvent() {
            const { author } = event;
            const allEventCommand = GoatBot.eventCommands.entries();
            for (const [key] of allEventCommand) {
                const getEvent = GoatBot.eventCommands.get(key);
                if (!getEvent)
                    continue;
                const commandName = getEvent.config.name;
                const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, getEvent);
                const time = getTime("DD/MM/YYYY HH:mm:ss");

                 // Event commands don't typically require prefix.
                 // But let's add a check to see if it's *only* meant for admins.
                 // This isn't requested, but a potential feature depending on the event command.
                 // For now, let's keep the original behavior: event commands run for everyone
                 // based on their internal triggers, unless banned/adminOnly globally.

                 // Check ban/adminOnly before running event handler
                 // Note: commandName might not perfectly map for events, but it's used for logging and texts.
                 // The isBannedOrOnlyAdmin check relies on commandName to see if it's ignored.
                 if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
                      continue; // Don't run event if user/thread is banned or adminOnly applies

                try {
                    const handler = await getEvent.onStart({ // Event commands use onStart as the main entry point
                        ...parameters,
                        commandName,
                        getLang: getText2
                    });
                    if (typeof handler == "function") {
                        await handler();
                        log.info("EVENT COMMAND", `Event: ${commandName} | ${author} | ${userData.name} | ${threadID}`);
                    }
                }
                catch (err) {
                    log.err("EVENT COMMAND", `An error occurred when calling the command event ${commandName}`, err);
                    await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred5", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
                }
            }
        }


        /*
         +------------------------------------------------+
         |                    ON EVENT                    |
         +------------------------------------------------+
        */
        async function onEvent() {
            const allOnEvent = GoatBot.onEvent || [];
            const args = []; // onEvent doesn't typically use message body
            const { author } = event;
            for (const key of allOnEvent) {
                if (typeof key !== "string")
                    continue;
                const command = GoatBot.commands.get(key);
                if (!command)
                    continue;
                const commandName = command.config.name;
                const time = getTime("DD/MM/YYYY HH:mm:ss");
                createMessageSyntaxError(commandName);

                const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command);

                if (getType(command.onEvent) == "Function") {
                    const defaultOnEvent = command.onEvent;
                    // convert to AsyncFunction
                    command.onEvent = async function () {
                        return defaultOnEvent(...arguments);
                    };
                }

                 // Check ban/adminOnly before running onEvent handler
                 if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
                      continue; // Don't run event if user/thread is banned or adminOnly applies

                command.onEvent({
                    ...parameters,
                    args,
                    commandName,
                    getLang: getText2
                })
                    .then(async (handler) => {
                        if (typeof handler == "function") {
                            try {
                                await handler();
                                log.info("onEvent", `${commandName} | ${author} | ${userData.name} | ${threadID}`);
                            }
                            catch (err) {
                                message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred6", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
                                log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err);
                            }
                        }
                    })
                    .catch(err => {
                        log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err);
                    });
            }
        }

        /*
         +------------------------------------------------+
         |                    PRESENCE                    |
         +------------------------------------------------+
        */
        async function presence() {
            // Your code here
        }

        /*
         +------------------------------------------------+
         |                  READ RECEIPT                  |
         +------------------------------------------------+
        */
        async function read_receipt() {
            // Your code here
        }

        /*
         +------------------------------------------------+
         |                   		 TYP                    	|
         +------------------------------------------------+
        */
        async function typ() {
            // Your code here
        }

        return {
            onAnyEvent,
            onFirstChat,
            onChat,
            onStart,
            onReaction,
            onReply,
            onEvent,
            handlerEvent, // Renamed from handlerEvent to match object key
            presence,
            read_receipt,
            typ
        };
    };
};

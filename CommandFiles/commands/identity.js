import { ReduxCMDHome } from "../modules/reduxCMDHome.js";
import { UNIRedux } from "../modules/unisym.js";
import { PasteClient } from "pastebin-api";

export const meta = {
  name: "identity",
  description:
    "Changes your identity or persona, allowing you to update your display name or alter how you are represented in the system. This command provides you with options to personalize your name, nickname, and other profile aspects.",
  author: "Liane",
  version: "1.1.1",
  usage: "{prefix}setname <newName>",
  category: "User Management",

  permissions: [0],
  noPrefix: false,
  waitingTime: 5,
  otherNames: ["id", "users"],
  requirement: "2.5.0",
  icon: "💬",
};

const { parseCurrency: pCy } = global.utils;

export const style = {
  title: "Identity 👤",
  titleFont: "bold",
  contentFont: "none",
};

const home = new ReduxCMDHome(
  {
    isHypen: true,
  },
  [
    {
      key: "profile",
      description:
        "View your profile details, such as name, bio, exp, and level",
      aliases: ["-p", "show", "view"],
    },
    {
      key: "find",
      description: "Search for users by name.",
      aliases: ["-s", "search"],
      async handler({ input, output, money, icon }) {
        const query = input.arguments.join(" ").trim().toLowerCase();

        if (!query) {
          output.reply(`Please provide a query to search for users.`);
          return;
        }

        try {
          const allUsers = await money.getAll();

          let matchedUsers = [];

          for (const userId in allUsers) {
            const userData = allUsers[userId];
            userData.name ??= "Unregistered";
            userData.userID = userId;

            if (userData.name.toLowerCase().includes(query)) {
              matchedUsers.push(userData);
            }
          }

          let response = `🔍 Search results for "${query}":\n\n`;

          if (matchedUsers.length > 0) {
            matchedUsers.forEach((userData, index) => {
              response += `${index < 10 ? `0` + (index + 1) : index + 1}. **${
                userData.name
              }**\n💌 ${userData.userID}\n`;
              response += `💰 $${userData.money}💵\n\n`;
            });
          } else {
            response += `No users found matching "${query}".`;
          }

          output.reply(response);
        } catch (error) {
          console.error("Error fetching user data:", error);
          output.error(error);
        }
      },
    },
    {
      key: "setname",
      description: "Set or change your display name.",
      args: ["<new name> (No Spaces)"],
      aliases: ["set", "-s"],
      async handler({
        input,
        output,
        money,
        args,
        Inventory,
        CassExpress,
        prefix,
      }) {
        const allData = await money.getAll();
        const userData = allData[input.senderID] ?? { ...money.defaults };
        let isRequire = !!userData.name;
        const name = args[0];

        if (!name || name.length > 20) {
          return output.reply(
            `❌ | Enter a name longer than 20 characters.\n\nExample: ${prefix}changeuser Nicaa`
          );
        }

        if (Object.values(allData).some((i) => i.name === name)) {
          return output.reply(`❌ | User with the same name already exists.`);
        }
        await money.set(input.senderID, {
          name,
        });

        return output.reply(`✅ | Successfully changed your name to "${name}"`);
      },
    },
    {
      key: "unregister",
      description: "Unregister your account or remove personal information.",
      aliases: ["-u"],
    },
    {
      key: "count",
      description:
        "Lists the total number of users and visualizes user statistics",
      aliases: ["-c"],
      async handler({ output, input, money }) {
        const allUsers = await money.getAll();
        const userCount = Object.keys(allUsers).length;
        const formattedUserCount = pCy(userCount);

        let maxStats = {};
        let maxUsers = {};

        for (const userID in allUsers) {
          const userData = allUsers[userID];
          for (const [key, value] of Object.entries(userData)) {
            if (typeof value === "number") {
              if (!(key in maxStats) || value > maxStats[key]) {
                maxStats[key] = value;
                maxUsers[key] = userData.name || "Unregistered";
              }
            }
          }
        }

        let statsResult = "User with the highest stats in each category:\n\n";
        for (const [key, value] of Object.entries(maxStats)) {
          const formattedValue = pCy(value);
          statsResult += `✓ **${maxUsers[key]}** has the highest **${key}** with a value of **${formattedValue}**.\n\n`;
        }

        const result = `There are **${formattedUserCount}** users in the **Cassidy Chatbot System.**\n\n${statsResult}`;

        output.reply(result);
      },
    },
    {
      key: "download",
      description: "Uploads your data and sends a Pastebin URL.",
      aliases: ["-bin"],
      args: ["<optional_id>"],
      async handler({ input, output, money, args }) {
        const ID = args.length > 0 ? args[0] : input.detectID || input.senderID;

        const userData = await money.get(ID);

        if (!userData.name) {
          return output.reply(`User not found.`);
        }
        const fileContent = JSON.stringify(userData, null, 2);

        try {
          const client = new PasteClient("R02n6-lNPJqKQCd5VtL4bKPjuK6ARhHb");
          const url = await client.createPaste({
            code: fileContent,
            expireDate: "N",
            format: "json",
            name: `${ID}.json`,
            publicity: 1,
          });
          const raw = url.replaceAll("pastebin.com/", "pastebin.com/raw/");

          return output.reply(
            `✅ | Uploaded to Pastebin!\n\n**Name:** ${userData.name}\n**URL:** ${raw}`
          );
        } catch (error) {
          return output.error(error);
        }
      },
    },
  ]
);

export async function entry(ctx) {
  return home.runInContext(ctx);
}

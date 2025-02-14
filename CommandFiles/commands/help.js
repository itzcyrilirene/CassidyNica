import { applyFonts } from "../../handlers/styler.js/fonts";
import {
  fontMarkups,
  isAdminCommand,
  listIcons,
  removeCommandAliases,
  toTitleCase,
  UNIRedux,
} from "../modules/unisym.js";
import { ShopClass } from "../plugins/shopV2.js";
import fs from "fs";
import path from "path";
import { Slicer } from "../plugins/utils-liane.js";

export const meta = {
  name: "help",
  author: "JenicaDev",
  description: "Shows a list of available commands.",
  version: "2.5.0",
  usage: "{prefix}{name} [commandName]",
  category: "System",
  permissions: [0],
  requirement: "2.5.0",
  otherNames: ["h"],
  icon: "🧰",
  noPrefix: "both",
};
const fonts = applyFonts;

/**
 * @type {CommandEntry}
 */
export async function entry({ api, input, output, commands, prefix }) {
  const event = input;
  const { body } = event;
  const [cmd, cmdName] = body.split(" ");

  if (!cmdName) {
    let helpMessage = `╭─❍「 𝗡𝗶𝗰𝗮𝗕𝗼𝗧 」\n`;

    let cmdNum = 1;
    const listedNames = [];
    let totalCommands = 0;

    Object.keys(commands).forEach((file) => {
      const commandName = file;
      const command = commands[commandName];

      if (
        !command.meta ||
        !command.meta.name ||
        (Array.isArray(command.meta.name) &&
          listedNames.includes(command.meta.name[0]))
      ) {
        return;
      }

      if (input.isAdmin === false && command.meta.adminOnly === true) {
        return;
      }

      const { name, description } = command.meta;
      if (listedNames.includes(name)) {
        return;
      }
      const displayName = Array.isArray(name) ? name[0] : name;

      helpMessage += `│ │ ✧ ${fonts(displayName || "No Name", "bold_italic")}${command.meta.noPrefix ? " (no prefix) " : ""} ${command.meta.adminOnly ? "✨" : ""}\n`;
      command.meta.description
        ? (helpMessage += `│ ➤ ${command.meta.description}\n`)
        : null;

      if (Array.isArray(name)) {
        listedNames.push(name[0]);
      } else {
        listedNames.push(name);
      }
      if (command.meta.adminOnly) {
        totalCommands--;
      }
      totalCommands++;
    });

    output.reply(
      fonts(
        helpMessage +
          `├───────────⟡
├─❍「 𝗜𝗻𝗳𝗼 」
│ ✧ ${prefix}help 「 name 」
│ ✧ Total: ${totalCommands}
├────────❍
│ 𝗡𝗶𝗰𝗮𝗕𝗼𝗧 🎀💌
╰───────────⟡`,
        "fancy",
      ),
    );
  } else {
    const reqCmd = commands[cmdName];

    if (!reqCmd) {
      output.reply(
        `The command '${input.arguments[0]}' does not exist in the loaded commands..`,
      );
      return;
    }

    const {
      name,
      description,
      usage,
      author,
      license,
      version,
      adminOnly,
      noPM,
      noGC,
    } = reqCmd.meta;
    let displayName = Array.isArray(name) ? name[0] : name;
    displayName =
      fonts(displayName.charAt(0).toUpperCase(), "bold") +
      fonts(displayName.slice(1), "bold");
    const otherNames =
      Array.isArray(name) && name.length > 1
        ? name.slice(1).join(", ")
        : "None";

    output.reply(
      fonts(
        `╭─❍「 ${displayName} 」
│ │ ✧ Aliases: 
│ ➤ ${otherNames}
│ │ ✧ Created by: 
│ ➤ ${author || "Anonymous"}
│ │ ✧ Version: 
│ ➤ @${version || "1.0.0"}
│ │ ✧ Permission: 
│ ➤ ${adminOnly ? "Bot Admin" : "Anyone"}
│ │ ✧ ${noPM ? "Exclusive to threads only" : noGC ? "🚫 Exclusive to private messages only" : "No thread restrictions."}
│ │ ✧ Description:
│ ➤ ${description || "There are no any descriptions."}
│ │ ✧ Usage: 
│ ➤ ${usage || "No usage provided"}${license ? "\n│ ✧ License:\n" + license : ""}
├────────❍
│ 𝗡𝗶𝗰𝗮𝗕𝗼𝗧 🎀💌
╰───────────⟡`,
        "fancy",
      ),
    );
  }
}

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
  waitingTime: 0.1,
};
const fonts = applyFonts;

/**
 * @type {CommandEntry}
 */
export async function entry({ api, input, output, commands, prefix }) {
  const event = input;
  const { body } = event;
  const [cmd, cmdName] = body.split(" ");

  if (!cmdName || !isNaN(cmdName)) {
    let helpMessage = `╭─❍「 𝗡𝗶𝗰𝗮𝗕𝗼𝗧 」\n`;

    let cmdNum = 1;

    const items = [
      ...new Set(
        Object.keys(commands).map((i) => String(commands[i].meta.name))
      ),
    ]
      .sort((a, b) => a.localeCompare(b))
      .filter(
        (name) =>
          (!input.isAdmin &&
            !Object.values(commands).some(
              (cmd) => cmd.meta.name === name && cmd.meta.botAdmin === true
            )) ||
          input.isAdmin
      );

    let totalCommands = items.length;
    const slicer = new Slicer(items, 10);
    const page = Slicer.parseNum(cmdName);

    slicer.getPage(page).forEach((file) => {
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

      const { name, description } = command.meta;

      const displayName = Array.isArray(name) ? name[0] : name;

      helpMessage += `│ │ ✧ ${fonts(displayName || "No Name", "bold_italic")}${
        command.meta.noPrefix ? " (no prefix) " : ""
      } ${command.meta.botAdmin ? "✨" : ""}\n`;
      command.meta.description
        ? (helpMessage += `│ ➤ ${command.meta.description}\n`)
        : null;
    });

    output.reply(
      fonts(
        helpMessage +
          `├───────────⟡
├─❍「 𝗜𝗻𝗳𝗼 」
│ ✧ ${prefix}help 「 name | page 」
│ ✧ Total: ${totalCommands}
│ ✧ Page: ${page}/${slicer.pagesLength + 1}
├────────❍
│ 𝗡𝗶𝗰𝗮𝗕𝗼𝗧 🎀💌
╰───────────⟡`,
        "fancy"
      )
    );
  } else {
    const reqCmd = commands[cmdName];

    if (!reqCmd) {
      output.reply(
        `The command '${input.arguments[0]}' does not exist in the loaded commands..`
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
      otherNames: a,
    } = reqCmd.meta;
    let displayName = Array.isArray(name) ? name[0] : name;
    displayName =
      fonts(displayName.charAt(0).toUpperCase(), "bold") +
      fonts(displayName.slice(1), "bold");
    const otherNames = a ? a.join(", ") : "None";

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
│ │ ✧ ${
          noPM
            ? "Exclusive to threads only"
            : noGC
            ? "🚫 Exclusive to private messages only"
            : "No thread restrictions."
        }
│ │ ✧ Description:
│ ➤ ${description || "There are no any descriptions."}
│ │ ✧ Usage: 
│ ➤ ${String(usage || "No usage provided")
          .replaceAll("{p}", prefix)
          .replaceAll("{prefix}", prefix)
          .replaceAll("{name}", name)}${
          license ? "\n│ ✧ License:\n" + license : ""
        }
├────────❍
│ 𝗡𝗶𝗰𝗮𝗕𝗼𝗧 🎀💌
╰───────────⟡`,
        "fancy"
      )
    );
  }
}

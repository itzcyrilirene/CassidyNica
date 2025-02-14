import Fonts from "../../handlers/styler.js/fonts.js";
import { fontTag } from "../../handlers/styler.js/main.js";
import {
  getCommandByFileName,
  getLatestCommands,
  isAdminCommand,
  ObjectX,
  removeCommandAliases,
  UNIRedux,
} from "../modules/unisym.js";

export const meta = {
  name: "prefix",
  author: "JenicaDev",
  version: "2.5.0",
  description: "Nothing special.",
  supported: "^2.5.0",
  order: 4,
  type: "plugin",
};

export async function use(obj) {
  const {
    input,
    output,
    icon,
    prefix,
    popularCMD,
    recentCMD,
    prefixes,
    commands: origCommands,
    commandName,
  } = obj;
  if (
    input.text?.toLowerCase() === "prefix" ||
    input.text?.toLowerCase() === "cassidy" ||
    input.text.trim() === prefix ||
    prefixes.some((prefix) => input.text.trim() === prefix)
  ) {
    const reply = Fonts.applyFonts(`█▄░█ █ █▀▀ ▄▀█\n█░▀█ █ █▄▄ █▀█\n🚀 Connected Successfully!\n\n➤ Prefix: 【 ${prefix} 】\n➤ Nickname: ${"None"}\n➤ Devs: Jenica Ferrer & Liane Cagara`, "fancy");

    output.reply(reply);
  } else {
    obj.next();
  }
}

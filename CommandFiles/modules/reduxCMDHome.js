/*
  WARNING: This source code is created by Liane Cagara.
  Any unauthorized modifications or attempts to tamper with this code 
  can result in severe consequences, including a global ban from my server.
  Proceed with extreme caution and refrain from any unauthorized actions.
*/
// Modified by JenicaDev

import { UNIRedux } from "./unisym.js";

/**
 * @typedef {{ key: string; handler: CommandEntry , description: string | null, args: string[] | null, aliases: string[] | null }} Config
 */

export class ReduxCMDHome {
  /**
   *
   * @param {{ home: Function, isHypen: boolean, argIndex: number, setup: Function, entryConfig: {}; entryInfo: { [key: string] : null | Config } }} options
   * @param {Config[]} configs
   */
  constructor(
    {
      home,
      isHypen = false,
      argIndex = 0,
      setup = () => {},
      entryConfig,
      entryInfo,
    },
    configs
  ) {
    if (entryConfig) {
      configs = Object.entries(entryConfig).map(([key, handler]) => ({
        key,
        handler,
        ...(entryInfo[key] ?? {}),
      }));
      isHypen = true;
      argIndex = 0;
    }
    this.configs = configs;

    this.options = { home, isHypen, argIndex, setup };
  }

  async runInContext(ctx) {
    const { args, input, output } = ctx;
    const key = this.options.isHypen
      ? input.propertyArray[this.options.argIndex]
      : input.arguments[this.options.argIndex];

    const targets = this.configs.filter((i) => {
      if (i.key === key || i.key.toLowerCase() === String(key).toLowerCase()) {
        return true;
      }

      if (Array.isArray(i.aliases)) {
        return (
          i.aliases.includes(key) ||
          i.aliases.some(
            (j) =>
              String(j).toLowerCase() === String(key).toLowerCase() ||
              String(j).replace("-", "").toLowerCase() ===
                String(key).replace("-", "").toLowerCase()
          )
        );
      }
    });

    const extraCTX = {};

    try {
      await this.options.setup(ctx, extraCTX);
    } catch (error) {
      console.error("Error during setup:", error);
      return output.error(error);
    }

    if (targets.length > 0) {
      for (const { handler } of targets) {
        try {
          await handler(ctx, extraCTX);
        } catch (error) {
          console.error("Error during handler execution:", error);
          return output.error(error);
        }
      }
    } else {
      const { home } = this.options;
      const newArgs = [ctx.commandName, ...input.arguments.original];

      const slicedArgs = newArgs.slice(0, this.options.argIndex + 1);

      const itemList = this.createItemLists(
        this.configs,
        this.options.isHypen ? ctx.commandName : slicedArgs.join(" "),
        ctx.prefix
      );

      console.log(
        "No matching targets found, calling home function with itemList:",
        itemList
      );
      ctx.cancelCooldown?.();

      if (typeof home === "function") {
        try {
          await home(ctx, { ...extraCTX, itemList });
        } catch (error) {
          console.error("Error during home function execution:", error);
          return output.error(error);
        }
      } else {
        await output.reply(
          `${itemList}\n\n***Example***: ${ctx.prefix}${ctx.commandName}-${
            this.configs.at(Math.floor(Math.random() * this.configs.length)).key
          }\n${UNIRedux.standardLine}\n${
            UNIRedux.reduxMark
          } [font=fancy_italic]Innovation.[:font=fancy_italic]`
        );
      }
    }
  }

  /**
   *
   *
   *
   * @param {Config} config
   */
  createItemList(config, commandName, prefix = global.Cassidy.config.PREFIX) {
    console.log(
      `Creating item list for command: ${commandName} with prefix: ${prefix}`
    );
    return `${UNIRedux.arrow} ${this.options.isHypen ? "-" : ""}${config.key}${
      Array.isArray(config.aliases)
        ? ` | ${config.aliases
            .map((i) => (this.options.isHypen ? `-${i}` : i))
            .join(" | ")}`
        : ""
    } ${
      Array.isArray(config.args)
        ? config.args.join(" ").replaceAll("<", "< ").replaceAll(">", " >")
        : ""
    }${
      typeof config.description === "string" ? `\n${config.description}` : ""
    }`;
  }

  /**
   *
   * @param {Config[]} configs
   */
  createItemLists(configs, commandName, prefix = global.Cassidy.config.PREFIX) {
    return configs
      .map((i) => this.createItemList(i, commandName, prefix))
      .join("\n");
  }
}

/**
 * @typedef {{ key: string; handler: Function , description: string | null, args: string[] | null, aliases: string[] | null }} Config
 */

export class ReduxCMDHomeGoat {
  /**
   *
   * @param {{ home: Function, argIndex: number, setup: Function, }} options
   * @param {Config[]} configs
   */
  constructor({ home, argIndex = 0, setup = () => {} }, configs) {
    const isHypen = false;

    this.configs = configs;

    this.options = { home, argIndex, setup };
  }

  async runInContext(ctx) {
    const { args, event: input, message: output } = ctx;
    const key = args[this.options.argIndex];

    const targets = this.configs.filter((i) => {
      if (i.key === key || i.key.toLowerCase() === String(key).toLowerCase()) {
        return true;
      }

      if (Array.isArray(i.aliases)) {
        return (
          i.aliases.includes(key) ||
          i.aliases.some(
            (j) =>
              String(j).toLowerCase() === String(key).toLowerCase() ||
              String(j).replace("-", "").toLowerCase() ===
                String(key).replace("-", "").toLowerCase()
          )
        );
      }
    });

    const extraCTX = {};

    try {
      await this.options.setup(ctx, extraCTX);
    } catch (error) {
      console.error("Error during setup:", error);
      return output.error(error);
    }

    if (targets.length > 0) {
      for (const { handler } of targets) {
        try {
          await handler(ctx, extraCTX);
        } catch (error) {
          console.error("Error during handler execution:", error);
          return output.error(error);
        }
      }
    } else {
      const { home } = this.options;
      const newArgs = [ctx.commandName, ...input.arguments.original];

      const slicedArgs = newArgs.slice(0, this.options.argIndex + 1);

      const itemList = this.createItemLists(
        this.configs,
        this.options.isHypen ? ctx.commandName : slicedArgs.join(" "),
        global.utils.getPrefix(input.threadID)
      );

      console.log(
        "No matching targets found, calling home function with itemList:",
        itemList
      );

      if (typeof home === "function") {
        try {
          await home(ctx, { ...extraCTX, itemList });
        } catch (error) {
          console.error("Error during home function execution:", error);
          return output.error(error);
        }
      } else {
        await output.reply(
          `${UNIRedux.burger} **Options**\n\n${itemList}\n\n${UNIRedux.standardLine}\nAuto-Generated by ${UNIRedux.reduxMark}`
        );
      }
    }
  }

  /**
   *
   *
   *
   * @param {Config} config
   */
  createItemList(config, commandName, prefix = global.GoatBot.config.prefix) {
    console.log(
      `Creating item list for command: ${commandName} with prefix: ${prefix}`
    );
    return (
      `${UNIRedux.disc} **${prefix}${commandName}${
        this.options.isHypen ? "-" : " "
      }${config.key}** [font=fancy_italic]${
        Array.isArray(config.args) ? config.args.join(" ") : ""
      }[:font=fancy_italic]${
        typeof config.description === "string"
          ? `\n${UNIRedux.charm} ${config.description}`
          : ""
      }` +
      (!Array.isArray(config.aliases)
        ? ""
        : `\n[font=fancy_italic]Aliases: ${config.aliases.join(
            ", "
          )}[:font=fancy_italic]`)
    );
  }

  /**
   *
   * @param {Config[]} configs
   */
  createItemLists(configs, commandName, prefix = global.Cassidy.config.PREFIX) {
    return configs
      .map((i) => this.createItemList(i, commandName, prefix))
      .join("\n\n");
  }
}

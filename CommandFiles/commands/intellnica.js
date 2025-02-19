import { UserStatsManager } from "../../dist-commandfiles/handlers/database/handleStat.mjs";
import { UNIRedux } from "../modules/unisym.js";
import { Slicer } from "../plugins/utils-liane.js";
export const meta = {
  name: "intellnica",
  description: "CassidyNica's Intelligence Capabilities.",
  author: "Liane Cagara || JenicaDev",
  version: "1.1.0",
  usage: "{prefix}intellnica <action> [arguments]",
  category: "Utilities",
  permissions: [0],
  noPrefix: false,
  waitingTime: 1,
  otherNames: ["intell", "nicaint"],
  requirement: "2.5.0",
  icon: "✨",
};

const { invLimit } = global.Cassidy;

export const style = {
  title: "IntellNica™ ✨",
  titleFont: "bold_italic",
  contentFont: "fancy",
};

const keys = [
  "beekeep",
  "brew",
  "chop",
  "cook",
  "dig",
  "farm",
  "garden",
  "harvest",
  "littlejohn",
  "minecraft",
  "plantita",
  "resto",
  "spaceex",
  "trawl",
  "treasure",
];

/**
 * Bypassing the goddamn system para lamang malaman yong game simulator na data.
 * @param {CommandContext} ctx
 * @returns {CommandContext}
 */
const dangerousContext = (ctx) => {
  const money = {
    get() {
      throw new Error("Nica Intelligence");
    },
  };
  const dummy = new Proxy(
    {},
    {
      get() {
        return () => {};
      },
      set() {
        return true;
      },
    }
  );
  return {
    ...ctx,
    money,
    input: {
      ...ctx.input,
      arguments: [],
      body: "",
    },
    commandName: "intellnica",
    args: [],
    output: dummy,
    GameSimulator: ctx.GameSimulator,
  };
};

/**
 *
 * @param {import("../types/gamesimu.js").Item} itemData
 * @param {string[]} actionTune
 * @returns {Array<(import("../types/gamesimu.js").Item) & { score: number }>}
 */
function getBestItems(itemData, actionTune = []) {
  if (!Array.isArray(itemData) || itemData.length === 0) return null;

  return itemData
    .map((item) => {
      const tuneBonus = actionTune.includes(item.name) ? 1.1 : 1;
      const profit = (item.priceB - item.priceA) * item.chance * tuneBonus;
      const score = profit / item.delay;

      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Get the top 3 items that benefit the most from tuning.
 *
 * @param {import("../types/gamesimu.js").Item[]} itemData - Array of game items.
 * @returns {string[]} - Top 3 item names sorted by tuning effectiveness.
 */
function getBestTune(itemData) {
  if (!Array.isArray(itemData) || itemData.length === 0) return [];

  return itemData
    .map((item) => {
      const baseProfit = (item.priceB - item.priceA) * item.chance;
      const tunedProfit = baseProfit * 1.1;
      const baseScore = baseProfit / item.delay;
      const tunedScore = tunedProfit / item.delay;
      const scoreImprovement = tunedScore - baseScore;

      return { name: item.name, scoreImprovement };
    })
    .filter((item) => item.scoreImprovement > 0)
    .sort((a, b) => b.scoreImprovement - a.scoreImprovement)
    .slice(0, 3)
    .map((item) => item.name);
}

/**
 * Get the best game simulators sorted by their overall efficiency.
 *
 * @param {Record<string, GameSimulatorConstructor>} simulators - All game simulators.
 * @param {Record<string, { actionStamp: number; actionMax: number; totalItems: Record<string, number>; actionTune: string[] }>} states - User states for each game.
 * @returns {Array<{ key: string; avgScore: number; totalScore: number; maxScore: number; icon: string; verb: string; simulator: GameSimulatorConstructor }>}
 */
function getBestGames(simulators, states) {
  if (!simulators || !states) return [];

  return Object.entries(simulators)
    .map(([key, simulator]) => {
      const state = states[key];
      if (!state || !simulator.itemData) return null;

      const bestItems = getBestItems(simulator.itemData, state.actionTune);
      if (!bestItems || bestItems.length === 0) return null;

      const scores = bestItems.map((item) => item.score);
      const totalScore = scores.reduce((sum, score) => sum + score, 0);
      const avgScore = totalScore / scores.length;
      const maxScore = Math.max(...scores);

      return {
        key,
        simulator,
        avgScore,
        totalScore,
        maxScore,
        icon: simulator.checkIcon || "🎮",
        verb: simulator.verb || key,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.avgScore - a.avgScore);
}

/**
 * @type {CommandEntry}
 */
export async function entry(ctx) {
  const timeA = Date.now();
  const {
    input,
    output,
    GameSimulator,
    args,
    money,
    commands,
    prefix,
    commandName,
  } = ctx;
  let exist = [];
  let errs = {};
  const targets = Object.values(commands).find((data) => {
    if (exist.includes(data.meta.name)) {
      return;
    }
    exist.push(data.meta.name);
    return keys.includes(data.meta.name);
  });
  const dctx = dangerousContext(ctx);
  for (const target of targets) {
    try {
      await target.entry(dctx);
    } catch (error) {
      errs[target.meta.name] = error;
    }
  }
  let simulatorData = {
    ...GameSimulator.instances,
  };
  const userData = await money.get(input.senderID);

  /**
   * @type {Record<string, { actionStamp: number; actionMax: number; totalItems: Record<string, number>; actionTune: string[] }>}
   */
  const simulatorStates = Object.fromEntries(
    Object.entries(simulatorData).map(([key, val]) => {
      const {
        [key + "Stamp"]: actionStamp,
        [key + "MaxZ"]: actionMax = val.storage,
        [key + "Total"]: totalItems = {},
        [key + "Tune"]: actionTune = [],
      } = userData;

      return [key, { actionStamp, actionMax, totalItems, actionTune }];
    })
  );

  /**
   * @type {Record<string, { name: string; icon: string; desc: string; callback: CommandEntry }>}
   */
  const opts = [
    {
      name: "best_tune",
      icon: "🚀",
      desc: "Finds the top 3 best-tuned items. Can specify a key.",
      callback: (ctx) => {
        const { GameSimulator, output, args } = ctx;
        const key = args[1];

        let selectedSimulators = key
          ? simulatorData[key]
            ? [simulatorData[key]]
            : []
          : Object.values(simulatorData);

        const allItems = selectedSimulators
          .flatMap((sim) => sim.itemData)
          .filter(Boolean);

        if (!allItems.length) {
          return output.reply(
            key
              ? `⚠️ No items found for **${key}**.`
              : "⚠️ No items available for tuning analysis."
          );
        }

        const bestTunes = getBestTune(allItems);
        output.reply(
          `${
            bestTunes.length
              ? `🚀 **Top 3 Tuned Items${key ? ` in ${key}` : ""}:**\n${
                  UNIRedux.arrow
                } ${bestTunes.join(`\n${UNIRedux.arrowFromT} `)}`
              : `⚠️ No significant tuning benefits found${
                  key ? ` in ${key}` : ""
                }.`
          }\n\n${
            UNIRedux.arrowBW
          } Type ${prefix} ${commandName} best_tune <key> to check a specific game.`
        );
      },
    },
    {
      name: "best_items",
      icon: "🏆",
      desc: "Finds the best items.",
      callback: (ctx) => {
        const { GameSimulator, output, args } = ctx;
        const key = args[1];

        let selectedSimulators = key
          ? simulatorData[key]
            ? [simulatorData[key]]
            : []
          : Object.values(simulatorData);
        let selectedTunes = key
          ? simulatorStates[key]
            ? [simulatorStates[key]]
            : []
          : Object.values(simulatorStates);

        const allItems = selectedSimulators
          .flatMap((sim) => sim.itemData)
          .filter(Boolean);
        const allTunes = selectedTunes.flatMap((i) => i.actionTune);

        if (!allItems.length) {
          return output.reply(
            key
              ? `⚠️ No items found for **${key}**.`
              : "⚠️ No items available for analysis."
          );
        }

        const bestItems = getBestItems(allItems, allTunes).slice(0, 10);
        output.reply(
          `${
            bestTunes.length
              ? `🚀 **Best Items${key ? ` in ${key}` : ""}:**\n${
                  UNIRedux.arrow
                } ${bestItems
                  .map((i) => `${i.name}`)
                  .join(`\n${UNIRedux.arrowFromT} `)}`
              : `⚠️ No best items found${key ? ` in ${key}` : ""}.`
          }\n\n${
            UNIRedux.arrowBW
          } Type ${prefix} ${commandName} best_items <key> to check a specific game.`
        );
      },
    },
    {
      name: "list",
      icon: "📜",
      desc: "Lists available game keys for inspection.",
      callback: (ctx) => {
        const { GameSimulator, output } = ctx;
        const keys = Object.keys(simulatorData);

        output.reply(
          keys.length
            ? `📜 **Available Game Keys:**\n${UNIRedux.arrow} ${keys.join(
                `\n${UNIRedux.arrowFromT} `
              )}`
            : "⚠️ No game keys available."
        );
      },
    },

    {
      name: "best_game",
      icon: "🎮",
      desc: "Finds the most efficient game simulators.",
      callback: (ctx) => {
        const { GameSimulator, output, money, input } = ctx;
        const userData = money.get(input.senderID);

        const bestGames = getBestGames(simulatorData, simulatorStates).slice(
          0,
          3
        );
        output.reply(
          bestGames.length
            ? `🎮 **Top 3 Game Simulators:**\n${bestGames
                .map(
                  (game) =>
                    `${UNIRedux.charm} ${game.icon} ${
                      game.key
                    } (Avg Score: ${game.avgScore.toFixed(2)})`
                )
                .join("\n")}`
            : "⚠️ No high-performing games found."
        );
      },
    },
  ];

  const handler = opts.find((i) => i.name === sub);

  if (!handler) {
    const items = opts
      .map((i) => `${prefix}${commandName} ${i.name}\n[${i.icon} ${i.desc}]`)
      .join("\n");
    const res = `${UNIRedux.arrow} Welcome to IntellNica™!\n\n${items}`;

    return output.reply(res);
  }

  if (!handler.callback) {
    return output.reply(
      `🏗️🚧 Sorry, this feature is still a **work in progress.**`
    );
  }

  return handler.callback();
}

/*
  WARNING: This source code is created by Liane Cagara.
  Any unauthorized modifications or attempts to tamper with this code 
  can result in severe consequences, including a global ban from my server.
  Proceed with extreme caution and refrain from any unauthorized actions.
*/
import fs from "fs";
import axios from "axios";
const recentCMD = {};
const popularCMD = {};
let queue = [];
const { CassidyResponseStylerControl } = global.utils.StylerGlobal;

const awaitStack = new Proxy(
  {},
  {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      return [];
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  }
);
function setAwaitStack(id, key) {
  awaitStack[id] = [...awaitStack[id], key];
}
function hasAwaitStack(id, key) {
  return awaitStack[id].includes(key);
}
function delAwaitStack(id, key) {
  awaitStack[id] = awaitStack[id].filter((v) => v !== key);
}

function sortPlugin(allPlugins) {
  queue = [];
  for (const pluginName in allPlugins) {
    const plugin = allPlugins[pluginName];
    const { meta } = plugin;
    meta.order = meta.order || 5;
    if (!queue[meta.order]) {
      queue[meta.order] = [];
    }
    queue[meta.order].push(plugin);
  }
}
export async function middleware({ allPlugins }) {
  /*const url =
    "https://raw.githubusercontent.com/lianecagara/Cassidy-Public/main";
  while (true) {
    try {
      const getSimilarity = (a, b) => similarity.compareTwoStrings(a, b);
      const read = (fp, en = "utf-8", ...args) => {
        try {
          return fs.readFileSync(fp, en, ...args);
        } catch {
          return null;
        }
      };
      const files = [
        "Cassidy.js",
        "index.js",
        "spawner.js",
        "utils.js",
        "webSystem.js",
        "CommandFiles/commands/system.ts",
        "handlers/middleware/middleware.js",
      ];
      let problems = [];
      for (const file of files) {
        try {
          const raw = await axios.get(`${url}/${file}`);
          const current = read(file);
          const rate = getSimilarity(raw.data, current);
          if (rate < 0.9) {
            throw `File ${file} has been inappropriately modified, please revert it back to original: ${url}/${file}`;
          }
        } catch (error) {
          problems.push(typeof error === "object" ? error.message : error);
        }
      }
      if (problems.length > 0) {
        throw problems.join("\n");
      }
      break;
    } catch (error) {
      console.log(error);
    }
  }*/
  sortPlugin(allPlugins);
  return handleMiddleWare;
}

async function handleMiddleWare({
  api,
  event,
  commands,
  prefix,
  pageApi,
  discordApi,
  tphApi,
  wssApi,
}) {
  let pluginCount = 0;

  try {
    let prefixes = ["!", prefix, ...global.Cassidy.config.EXTRAPREFIX];
    if (Array.isArray(event.prefixes)) {
      prefixes = [...event.prefixes];
      prefix = prefixes[0];
    }
    const { createSafeProxy } = global.utils;
    const { logo: icon } = global.Cassidy;
    let [pref1 = "", commandName = "", ...etc] = (event.body ?? "")
      .split(" ")
      .filter((i) => !!i);
    if (prefixes.includes(pref1)) {
      commandName = pref1 + commandName;
      event.body = `${commandName} ${etc.join(" ")}`;
    } else {
      commandName = pref1;
    }

    if (!commandName) {
      commandName = "";
    }

    let hasPrefix;
    let currentPrefix = prefix;
    for (const prefix of prefixes) {
      hasPrefix = commandName.startsWith(prefix);
      if (hasPrefix) {
        currentPrefix = prefix;
        break;
      }
    }
    if (hasPrefix) {
      commandName = commandName.slice(currentPrefix.length);
    }
    let isLink = false;

    let command =
      commands[commandName] || commands[commandName.toLowerCase()] || null;
    if (command && command.meta && typeof command.meta.linkTo === "string") {
      commandName = command.meta.linkTo;
      isLink = true;
      console.log(`Linking '${command.meta.name}' to ${commandName}`);
    }
    let property = [];
    [commandName, ...property] = commandName
      .split("-")
      .map((i) => i.trim())
      .filter(Boolean);
    event.propertyArray = property;
    for (const prop of property) {
      property[prop] = `${property[prop] ?? ""}`;
    }
    event.property = {};
    for (let index = 0; index < property.length; index++) {
      const prop = property[index];
      mapProp(event.property, prop, index);
    }
    commandName = `${commandName ?? ""}`;

    function mapProp(obj, prop, index) {
      if (property[index + 1]) {
        if (property[index + 2]) {
          obj[prop] = {};
          mapProp(obj[prop], property[index + 1], index + 1);
        } else {
          obj[prop] = {
            [property[index + 1]]: true,
          };
        }
      } else {
        obj[prop] = true;
      }
    }

    const runObjects = {
      api: new Proxy(api || {}, {
        get(target, key) {
          if (event.isWss && key in wssApi) {
            return wssApi[key];
          }
          if (event.isTph && key in tphApi) {
            return tphApi[key];
          }
          if (event.isPage && key in pageApi) {
            return pageApi[key];
          }
          if (event.isDiscord && key in discordApi) {
            return discordApi[key];
          }
          if (key in target && !event.isDiscord) {
            return target[key];
          }
          return (...args) => {
            global.logger(
              `Warn: 
api.${key}(${args
                .map((i) => `[ ${typeof i} ${i?.constructor?.name || ""} ]`)
                .join(",")}) has no effect!`
            );
          };
        },
        set(target, key, value) {
          target[key] = value;
          return;
        },
      }),

      event,
      commands,
      prefix: currentPrefix || prefix,
      prefixes,
      allPlugins,
      queue,
      next,
      command,
      origAPI: api,
      commandName,
      hasPrefix,
      invTime: Date.now(),
      icon,
      Cassidy: global.Cassidy,
      safeCalls: 0,
      discordApi,
      pageApi,
      awaitStack,
      setAwaitStack,
      delAwaitStack,
      hasAwaitStack,
      clearCurrStack: () => {
        const { meta } = command || {};
        if (!meta) return;
        delAwaitStack(event.senderID, meta.name);
      },
      popularCMD,
      recentCMD,
    };
    runObjects.allObj = runObjects;
    let command2 =
      commands[commandName] || commands[commandName.toLowerCase()] || null;
    if (!isLink) {
      command = command2;
    } else if (command && command2 && isLink) {
      command = { ...command2, meta: command.meta };
    } else {
      return runObjects.api.sendMessage(
        `❌ Internal Middleware Issue: Cannot find linkTo ${commandName} => ${JSON.stringify(
          event.propertyArray
        )}`,
        event.threadID
      );
    }
    runObjects.command = command;
    const styler = new CassidyResponseStylerControl(command?.style ?? {});
    styler.activateAllPresets();
    runObjects.styler = styler;

    /*console.log({ ...event, participantIDs: "Hidden" });*/
    async function next() {
      pluginCount++;
      const currentOrder = queue.findIndex(
        (order) => order && order.length > 0
      );
      if (currentOrder !== -1) {
        const currentPlugin = queue[currentOrder].shift();
        try {
          const { use, meta } = currentPlugin;
          if (meta.name === "handleCommand") {
            return next();
          }
          global.runner = runObjects;
          await use(runObjects);
          return;
        } catch (error) {
          const { failSafe = [], meta } = currentPlugin ?? {};
          for (const key of failSafe) {
            runObjects[key] = new Proxy(() => {}, {
              get(_, key) {
                return (...args) => {
                  global.logger(
                    `Warn: the ${key}(${args
                      .map(
                        (i) => `[ ${typeof i} ${i?.constructor?.name || ""} ]`
                      )
                      .join(",")}) has no effect!`
                  );
                };
              },
              set() {
                return true;
              },
            });
          }
          console.log(error);
          return next();
        }
      } else {
        try {
          const { use } = allPlugins.handleCommand;
          await use({ ...runObjects, next: undefined });
        } catch (error) {
          console.log(error);
        }
      }
    }
    await runObjects.next();
    const currentOrder = queue.findIndex((order) => order && order.length > 0);
    if (currentOrder !== -1 && runObjects.safeCalls < 1) {
      const { meta } = queue[currentOrder].shift();
      /*console.warn(`⚠️ There are still plugins in the queue but t no response made!

Suspicious Plugin: ${meta.name}
Plugin Count: ${pluginCount}

Remaining: ${queue.reduce((a, b) => a + b.length, 0)}
Please check this plugin immediately!`);*/
    }
    global.logger(`All ${pluginCount} plugins have been handled!`);
  } catch (error) {
    console.log(error);
  }
}

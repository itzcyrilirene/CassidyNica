/*
  WARNING: This source code is created by Liane Cagara.
  Any unauthorized modifications or attempts to tamper with this code 
  can result in severe consequences, including a global ban from my server.
  Proceed with extreme caution and refrain from any unauthorized actions.
*/

import { CassEXP } from "../modules/cassEXP.js";
import { UNIRedux } from "../modules/unisym.js";

export const meta = {
  name: "output",
  author: "Liane Cagara",
  version: "1.0.0",
  description: "Output is a plugin that simplifies output responses.",
  supported: "^1.0.0",
  order: 3,
  IMPORTANT: true,
  type: "plugin",
};
const { fonts, delay } = global.utils;

export const style = {
  title: "🦋 Example Title",
  contentFont: "fancy",
  titleFont: "bold",
};

const { styled: oldStyler } = global.require("./handlers/middleware/styler");
function getFontKey(key) {
  const keyMaps = {
    bold: "bold",
    fancy: "sans",
    none: "none",
  };
  return keyMaps[key] || "bold";
}

class CassidyIO {
  constructor(input, output, style) {
    this.input = input;
    this.output = output;
    this.lastMessageID = null;
    this.style = style;
  }
  async out(text, sendID) {
    text = String(text.body ?? text);
    let info;
    if (sendID) {
      info = await this.output.sendStyled(text, this.style, sendID);
    } else {
      info = await this.output.replyStyled(text, this.style);
    }
    this.lastMessageID = info.messageID;
    return info;
  }
  async in({
    messageID: optionalID = this.lastMessageID,
    full,
    dontUpdate,
    callback: c = (ctx) => ctx.repObj.resolve(ctx),
    test,
    testFail,
  } = {}) {
    let callback = c;

    if (test) {
      callback = async (ctx) => {
        let { repObj, input } = ctx;
        if (await test(input)) {
          await c(ctx);
        } else if (testFail) {
          await testFail(ctx);
        }
      };
    }
    const ctx = await this.output.addReplyListener(
      optionalID ?? this.lastMessageID,
      callback
    );
    if (!dontUpdate) {
      this.output = ctx.output;
      this.input = ctx.input;
    }
    return full ? ctx : ctx.input;
  }
}

async function styled(text, options = style) {
  const styleKey = getFontKey(options.contentFont);
  return `${fonts.bold(String(options.title).trim())}
${options.lineStart ? options.lineStart : "━━━━━━━━━━━━━━━"}
${styleKey === "none" ? String(text).trim() : fonts.sans(String(text).trim())}
${options.lineEnd ? options.lineEnd : "━━━━━━━━━━━━━━━"}`.trim();
}

/**
 *
 * @type {CommandEntry}
 */
export function use(obj) {
  try {
    obj.CassidyIO = CassidyIO;
    obj.styled = styled;
    const { api, event, command: cmd, commands, input } = obj;
    let append = "";
    let prepend = "";
    async function output(text, options = {}) {
      const { styler } = obj;
      const newMid = `web:mid-${Date.now()}`;
      if (typeof text === "object") {
        Object.assign(options, text);
      } else if (typeof text === "string") {
        Object.assign(options, {
          body: text,
        });
      }

      const { UserStatsLocal, money, CassEncoder } = obj;
      const { replies = {} } = global.Cassidy;
      const { currData } = global;
      let repCommand;
      if (input.replier && replies[input.replier.messageID]) {
        const { commandKey } = replies[input.replier.messageID];
        repCommand = commands[commandKey] || commands[commandKey.toLowerCase()];
      }

      let command = cmd || repCommand || currData;
      options.body = `${prepend}\n${options.body}\n${append}`;
      options.body = options.body.trim();
      //options.body = fonts.auto(options.body);
      const stylerShallow = styler.shallowMake(
        Object.assign({}, options.defStyle ?? {}, input.defStyle ?? {}),
        Object.assign({}, options.style ?? {}, input.style ?? {})
      );
      /*if (
        (command &&
          command.style &&
          typeof command.style === "object" &&
          !options.noStyle) ||
        options.defStyle
      ) {
        options.defStyle ??= {};
        options.style ??= {};
        options.body = await styled(options.body, {
          ...options.defStyle,
          ...(command.style || {}),
          ...options.style,
        });
      }*/
      if (
        command?.meta?.noLevelUI !== true &&
        global.Cassidy.config.noLevelUI !== true &&
        obj.money
      ) {
        const {
          cassEXP,
          name,
          money: userMoney,
          inventory = [],
          boxItems = [],
        } = await obj.money.getCache(options.threadID ?? input.senderID);
        const inst = new CassEXP(cassEXP);

        options.body = name
          ? `${options.body}\n\n━━━━【**Profile**】━━━━━\n📛 **${name}** ${
              UNIRedux.charm
            } **LV${inst.level}** (${inst.exp}/${inst.getNextEXP()})`
          : options.body;
      }
      if (!options.noStyle) {
        options.body = stylerShallow.text(options.body);
      }
      if (options.noStyle) {
        delete options.noStyle;
      }
      options.body = options.body.trim();
      //console.log(options);
      for (const kk of [input.webQ]) {
        if (!global.webQuery[kk]) {
          continue;
        }
        let modifiedData = null;
        if (money instanceof UserStatsLocal) {
          modifiedData = money.modifiedProperties;
        }
        global.webQuery[kk].resolve({
          status: "success",
          result: { ...options, messageID: newMid },
          newMid,
          modifiedData,
        });
        //console.log(`Resolved message to ${input.webQ} with mid: ${newMid}`);
      }
      if (options.referenceQ === input.webQ) {
      }
      if (input.isWeb) {
        return new Promise((r) => {
          r({
            ...options,
            messageID: newMid,
          });
        });
      }
      //console.log(options);
      return new Promise((res, rej) => {
        api.sendMessage(
          options.body,
          options.threadID || event.threadID,
          async (err, info) => {
            if (typeof options.callback === "function") {
              await options.callback(info);
            }

            if (err) {
              console.log(err);
              //return rej(err);
            }

            const resu = {
              ...options,
              ...info,
              senderID: api?.getCurrentUserID() || "",
              body: options.body,
            };
            //console.log(resu);
            res(resu);
          },
          options.messageID || (options.isReply ? event.messageID : null)
        );
      });
    }
    const outputProps = {
      async reply(body, callback) {
        return await output(body, { callback, isReply: true });
      },
      async contact(text, id, destination) {
        return new Promise(async (res, rej) => {
          await api.shareContact(
            text || "",
            id || input.senderID,
            destination || input.threadID,
            (err) => {
              if (err) {
                return rej(err);
              }
              res(true);
            }
          );
        });
      },
      async error(err, callback) {
        let error = err;
        if (typeof error !== "object" && typeof error !== "string") {
          throw new Error(
            `The first argument must be an Error instance or a string.`
          );
        }
        if (typeof error === "string") {
          error = new Error(`${error}`);
        }
        const errMsg = formatError(error);
        return await output(errMsg, { callback, isReply: true });
      },
      async wentWrong() {
        return await output(
          "❌ Sorry, something went wrong. This message indicates that an **unexpected issue has occurred**, which may lead to potential problems if not addressed. **It is uncommon to see this message**, as it is primarily used for rapid edge case handling and debugging. Better error messages will be added in the **future**. Please **report** this to the administrator or developer for further investigation.",
          { isReply: true }
        );
      },
      async send(body, id, callback) {
        return await output(body, { callback, threadID: id });
      },
      async add(user, thread = event.threadID) {
        api.addUserToGroup(user, thread, (err) => {});
      },
      async kick(user, thread = event.threadID) {
        api.removeUserFromGroup(user, thread, (err) => {});
      },
      async unsend(mid) {
        api.unsendMessage(mid, (err) => {});
      },
      async reaction(emoji, mid = event.messageID) {
        api.setMessageReaction(emoji, mid, (err) => {}, true);
      },
      get prepend() {
        return prepend;
      },
      set prepend(val) {
        prepend = val;
      },
      get append() {
        return append;
      },
      set append(val) {
        append = val;
      },
      replyStyled(body, style, thread) {
        return output(body, {
          threadID: thread,
          style: style || {},
          isReply: true,
        });
      },
      sendStyled(body, style, thread) {
        return output(body, {
          threadID: thread,
          style: style || {},
        });
      },

      async confirm(body, done, sstyle) {
        const text = `⚠️ ${body}\n${UNIRedux.standardLine}\n**Yes** | **No**`;
        const info = sstyle
          ? await this.replyStyled(text, sstyle)
          : await this.reply(text);

        return new Promise((resolve, reject) => {
          input.setReply(info.messageID, {
            author: input.senderID,

            /**
             *
             * @param {CommandContext} repCtx
             */
            callback(repCtx) {
              if (repCtx.input.senderID !== input.senderID) {
                return;
              }
              const newCtx = {
                ...repCtx,
                yes: repCtx.input.body.toLowerCase() === "yes",
                no: repCtx.input.body.toLowerCase() === "no",
              };
              if (!newCtx.yes && !newCtx.no) {
                return repCtx.output.reply(
                  `❌ Invalid response, please go back and reply either **yes** or **no**.`
                );
              }
              done?.(repCtx);
              resolve(repCtx);
              input.delReply(info.messageID);
            },
          });
        });
      },
    };
    outputProps.Styled = class {
      constructor(style) {
        this.style = style;
        this.lastID = null;
      }
      async reply(body) {
        const i = await outputProps.replyStyled(body, this.style);
        this.lastID = i.messageID;
        return i;
      }
      async send(body) {
        const i = await outputProps.sendStyled(body, this.style);
        this.lastID = i.messageID;

        return i;
      }
      async edit(body, messageID, delay) {
        return outputProps.edit(
          body,
          this.lastID ?? messageID,
          delay,
          this.style
        );
      }
    };
    outputProps.syntaxError = async (commandX) => {
      let cmdName = null;
      if (obj.command || commandX) {
        const { metadata = {} } = obj.command || commandX;
        cmdName = metadata.name;
      }
      return await outputProps.reply(
        `❌ The command syntax you are using is invalid, please use ${
          cmdName ? `${obj.prefix}help ${cmdName}` : `the help command`
        } to see how it works.`
      );
    };
    //Only works to Fca of NicaBoT:
    outputProps.edit = async (text, mid, delay, style = {}) => {
      //const refStyle = { ...(cmd && cmd.style ? cmd.style : {}), ...style };
      const { styler } = obj;
      const stylerShallow = styler.shallowMake({}, style);

      if (!isNaN(parseInt(delay))) {
        await delay(parseInt(delay));
      }
      let result = prepend + "\n" + text + "\n" + append;
      /*if (Object.keys(refStyle).length > 0) {
        result = await styled(result, refStyle);
      }*/
      result = stylerShallow.text(text);
      return new Promise((res) => {
        const aa = api.editMessage(result, mid, () => res(true));
        if (aa instanceof Promise) {
          aa.then(res);
        } else {
          res();
        }
      });
    };
    outputProps.frames = async (...args) => {
      let texts = [];
      let mss = [];
      args.forEach((item, index) => {
        if (index % 2 === 0) {
          texts.push(item);
        } else {
          mss.push(item);
        }
      });
      const output = outputProps;
      const i = await output.reply(texts[0]);
      texts.shift();
      for (const index in texts) {
        const text = texts[index];
        await delay(mss[index] || 1000);
        await output.edit(text, i.messageID);
      }
      return i;
    };

    //assignProp(output, outputProps);
    /* obj.outputNew = new Proxy(output, {
      get(_, prop) {
        if (prop in outputProps) {
          return outputProps[prop];
        } else {
          throw new Error(`The property output.${prop} does not exist.`);
        }
      },
      set(_, prop, value) {
        outputProps[prop] = value;
      }
    });*/
    outputProps.react = outputProps.reaction;
    obj.output = outputProps;
    obj.outputOld = output;
    obj.output.formatError = formatError;
    class AutoEdit {
      constructor(lim = 6) {
        this.editCount = 0;
        this.stack = "";
        this.messageID = null;
        this.lim = lim;
      }
      async do(message) {
        if (!this.messageID) {
          const { messageID } = await obj.output.reply(message);
          this.messageID = messageID;
          return this;
        }
        if (this.editCount < this.lim) {
          await obj.output.edit(message, this.messageID);
          this.editCount++;
          return this;
        } else {
          const newInstance = new AutoEdit();
          await newInstance.do(message);
          return newInstance;
        }
      }
      async addUp(message) {
        const i = await this.do(this.stack + message);
        this.stack += message;
        return i;
      }
    }
    obj.AutoEdit = AutoEdit;
  } catch (err) {
    console.log(err);
  }
  const cassIO = new CassidyIO(obj.input, obj.output, obj.command?.style);
  obj.cassIO = cassIO;
  obj.next();
}

function assignProp(func, obj) {
  const wrapper = (...args) => {
    return func(...args);
  };

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      wrapper[key] = obj[key];
    }
  }

  return wrapper;
}

function formatErrorOld(error) {
  let errorMessage = "❌ | An error has occurred:\n";

  if (error instanceof Error) {
    const { name, message, stack, ...rest } = error;

    if (stack) errorMessage += `${stack}\n`;

    for (const key in rest) {
      if (Object.prototype.hasOwnProperty.call(rest, key)) {
        errorMessage += `${key}: ${rest[key]}\n`;
      }
    }
  } else {
    errorMessage = "Invalid error object provided";
  }

  return errorMessage;
}

function hdst(stackTrace) {
    const cwd = process.cwd();
    const regex = new RegExp(cwd, 'g');
    return stackTrace?.replace(regex, "JenicaDev/nicabot");
}


function formatError(error) {
    const errorString = `Error: ${error.toString()}\n`;
    const errorCode = error.code ? `Code: ${error.code}\n` : '';
    const errorName = error.name ? `Name: ${error.name}\n` : '';
    const errorStack = error.stack ? `Stack:\n${error.stack}\n` : '';

    return hdst(`❌ | An Error Occured! \n\n${errorString}${errorCode}${errorName}${errorStack}\n\nJenicaDev: ${global.Cassidy.logo} ${global.package.version}`);
}
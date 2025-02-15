import { isNaN } from "mathjs";
import { UNIRedux } from "../modules/unisym.js";

export const meta = {
  name: "nicadrive",
  description:
    "A personal storage system for extra items. Store, retrieve, and manage inventory beyond your main limit. Upgrade for more space!",
  author: "JenicaDev",
  version: "1.0.0",
  usage: "{prefix}ndrive <action> [arguments]",
  category: "Inventory",
  permissions: [0],
  noPrefix: false,
  waitingTime: 1,
  otherNames: ["ndrive"],
  requirement: "2.5.0",
  icon: "💾",
};

const { invLimit } = global.Cassidy;

const ndriveLimit = 100;
const proLimit = 400;

export const style = {
  title: "NicaDrive™ 💾",
  titleFont: "bold_italic",
  contentFont: "fancy",
};

/**
 * @param {string[]} args
 */
function normalizeArgAmount(args) {
  const copy = Array.from(args);
  const newCopy = [];
  for (let i = 0; i < copy.length; i++) {
    const value = copy[i];
    let [key, amount = "1"] = value.split("*");
    amount = parseInt(amount);
    if (isNaN(amount)) {
      amount = 1;
    }
    if (amount > invLimit) {
      amount = invLimit;
    }
    for (let j = 0; j < amount; j++) {
      newCopy.push(key);
    }
  }
  return newCopy.map(String);
}

/**
 * @type {CommandEntry}
 */
export async function entry({
  api,
  input,
  output,
  prefix,
  Inventory,
  money,
  args,
}) {
  let [sub, ...subArgs] = args;
  subArgs = normalizeArgAmount(subArgs);

  const subArgsStr = subArgs.join(" ");
  const userData = await money.get(input.senderID);

  let { ndrive } = userData;
  const userInventory = new Inventory(userData.inventory ?? []);

  if (!ndrive) {
    ndrive = {
      name: null,
      items: [],
      storageRequested: 100,
      premium: false,
    };
    const ii = await output.replyStyled(
      `Before we begin, let’s set up your **NicaDrive™ Account**.\nPlease answer a few questions to personalize your experience!\n${UNIRedux.standardLine}\n🏷️ **What name should we use for your NicaDrive™ account?**\n(Example: “Nica’s Storage” or just your name.)\n\n***Reply with your name now!***`,
      style,
    );

    input.setReply(ii.messageID, {
      /**
       * @param {CommandContext} repCtx
       */
      async callback(repCtx) {
        const name = repCtx.input.body.split(" ")[0].slice(0, 20);

        if (!name) {
          return;
        }

        if (repCtx.input.senderID !== input.senderID) {
          return;
        }

        const ii2 = await output.replyStyled(
          `✅ Great! Your NicaDrive™ account is now named **"${name}"**\n${UNIRedux.standardLine}\n📦 **How many items would you like to store?**\n\n***Reply with a number.***`,
          style,
        );

        ndrive.name = name.replace(/\b\w/g, (char) => char.toUpperCase());

        input.setReply(ii2.messageID, {
          async callback(repCtx2) {
            const storageRequested = parseInt(repCtx2.input.body);

            if (!storageRequested) {
              return;
            }

            let isNaNReq = isNaN(storageRequested);

            let res = isNaNReq
              ? `💾 It looks like you're not quite ready to decide. That’s okay! We’ll handle it for you. ✅`
              : storageRequested > 0 && storageRequested <= 100
                ? `💾 All set! Your items are safely stored. Thanks for using NicaDrive™. 📦`
                : storageRequested > 0
                  ? `💾 That’s quite a lot! No worries, we’ll handle it as best as we can. 🏗️`
                  : `💾 An unconventional choice! Don’t worry, we’ve taken care of everything. 🌱`;

            ndrive.storageRequested = storageRequested;

            const res2 = `${res}\n${UNIRedux.standardLine}\n💾 NicaDrive™ Account Setup Complete! 🎉\n\n**📂 Your NicaDrive™ Features:**\n***Storage Capacity***: 0/${ndriveLimit} used\n***Instant Access***: Store and retrieve items anytime! (When it’s not updating.)\n***Secure ndrive***: Your items are totally safe.\n***Smart Optimization***: We make the best use of your storage!\n\n**💾 You're all set!** Use **${prefix}ndrive** anytime to start storing and managing your items.\n${UNIRedux.standardLine}\n💎 **Upgrade to NicaDrive™ Premium?**\nWant more storage, faster retrievals, and exclusive features? Sign up for NicaDrive Premium™ today!\n\n🔹 Benefits include:\n✔️ Increased storage limit! (How much? That’s a surprise.)\n✔️ Priority item retrieval! (Less waiting)\n✔️ Exclusive support! (We might respond.)`;

            await money.set(input.senderID, {
              ndrive,
            });

            return output.replyStyled(res2, style);
          },
        });
      },
    });

    return;
  }

  if (!Array.isArray(ndrive.items)) {
    return output.wentWrong();
  }

  const nicaItems = new Inventory(ndrive.items ?? [], proLimit);
  const limit = ndrive.premium ? proLimit : ndriveLimit;

  /**
   * @param {Inventory}
   */
  async function createItemMenu(items = nicaItems) {
    const ndriveItemsList = items.getAll();
    let pushedKeys = [];
    let ndriveItemList = ndriveItemsList
      .map((item) => {
        if (pushedKeys.includes(item.key)) {
          return null;
        }
        const amount = items.getAmount(item.key);
        pushedKeys.push(item.key);
        return `${item.icon} **${item.name}** (x${amount}) [${item.key}]`;
      })
      .filter(Boolean)
      .join("\n");
    const invItemsList = userInventory.getAll();
    let pushedKeys2 = [];
    let invItemList = invItemsList
      .map((item) => {
        if (pushedKeys2.includes(item.key)) {
          return null;
        }
        const amount = userInventory.getAmount(item.key);

        pushedKeys2.push(item.key);
        return `${item.icon} **${item.name}** (x${amount}) [${item.key}]`;
      })
      .filter(Boolean)
      .join("\n");
    const arrayInv = invItemList.split("\n");
    const diff = 8 - arrayInv.length;
    for (let i = 0; i < diff; i++) {
      arrayInv.push("");
    }
    let result = [];

    if (result) {
      invItemList += `\n`;
    }
    invItemList += result.join("\n");

    const arrayndrive = ndriveItemList.split("\n");
    const diff2 = 8 - arrayndrive.length;
    for (let i = 0; i < diff2; i++) {
      arrayndrive.push("");
    }
    let result2 = [];

    if (result2) {
      ndriveItemList += `\n`;
    }
    ndriveItemList += result2.join("\n");

    return `***👤 ${ndrive.name}*** ${userInventory.size()}/${invLimit}\n\n${userInventory.size() > 0 ? invItemList.trim() : "Empty"}\n\n***💾 NicaDrive™*** ${items.size()}/100\n\n${items.size() > 0 ? ndriveItemList.trim() : "No items stored. Start storing now!"}`;
  }

  const opts = [
    {
      name: "view",
      icon: "📦",
      desc: "View Stored Items",
      async callback() {
        return output.replyStyled(await createItemMenu(), style);
      },
    },
    {
      name: "store",
      icon: "📥",
      desc: "Store Item(s)",
      async callback() {
        const keysToStore = subArgs;

        if (keysToStore.length < 1) {
          return output.reply(
            `❌ Please specify an item key to store in the NicaDrive\n\n${await createItemMenu()}`,
          );
        }
        let str = ``;
        for (const keyToStore of keysToStore) {
          const itemToStore = userInventory.getOne(keyToStore);
          if (!itemToStore) {
            str += `❌ Item with key "${keyToStore}" not found in your inventory.\n`;
            continue;
          }
          if (nicaItems.getAll().length >= ndriveLimit) {
            str += `❌ NicaDrive is full.\n`;
            continue;
          }
          if (itemToStore.cannotvault === true) {
            str += `❌ Item with key "${keyToStore}" cannot be stored in the NicaDrive.\n`;
            continue;
          }
          userInventory.deleteOne(keyToStore);
          nicaItems.addOne(itemToStore);

          str += `✅ ${itemToStore.icon} ${itemToStore.name}\n`;
        }
        ndrive.items = nicaItems.getAll();
        await money.set(input.senderID, {
          inventory: Array.from(userInventory),
          ndrive,
        });

        return output.reply(`${str.trim()}\n\n${await createItemMenu()}`);
      },
    },
    {
      name: "retrieve",
      icon: "📤",
      desc: "Retrieve Item(s)",
      async callback() {
        const keysToRetrieve = subArgs;
        if (keysToRetrieve.length < 1) {
          return output.reply(
            `❌ Please specify an item key to retrieve from the NicaDrive.\n\n${await createItemMenu()}`,
          );
        }
        let str2 = ``;
        for (const keyToRetrieve of keysToRetrieve) {
          const itemToRetrieve = nicaItems.getOne(keyToRetrieve);
          if (!itemToRetrieve) {
            str2 += `❌ Item with key "${keyToRetrieve}" not found in the NicaDrive.\n`;
            continue;
          }
          if (userInventory.getAll().length >= invLimit) {
            str2 += `❌ Your Inventory is full.\n`;
            continue;
          }
          nicaItems.deleteOne(keyToRetrieve);
          userInventory.addOne(itemToRetrieve);
          str2 += `✅ ${itemToRetrieve.icon} ${itemToRetrieve.name}\n`;
        }
        ndrive.items = nicaItems.getAll();

        await money.set(input.senderID, {
          ndrive,
          inventory: Array.from(userInventory),
        });

        return output.reply(`${str2.trim()}\n\n${await createItemMenu()}`);
      },
    },
    {
      name: "upgrade",
      icon: "🚀",
      desc: "Upgrade to NicaDrive Premium™",
    },
    {
      name: "settings",
      icon: "⚙️",
      desc: "Settings",
    },
  ];

  const handler = opts.find((i) => i.name === sub);

  if (!handler) {
    const items = opts
      .map((i) => `${prefix}${i.name}\n[${i.icon} ${i.desc}]`)
      .join("\n");
    const res = `📂 Welcome to NicaDrive™!\nName: **${ndrive.name}**\nYour Storage: ${nicaItems.size()}/${limit} used (Upgrade to NicaDrive Premium™ for more!)\n\n${items}`;

    return output.reply(res);
  }

  if (!handler.callback) {
    return output.reply(
      `🏗️🚧 Sorry, this feature is still a **work in progress.**`,
    );
  }

  return handler.callback();
}

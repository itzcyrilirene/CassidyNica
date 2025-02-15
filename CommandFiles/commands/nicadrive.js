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
  const [sub, ...subArgs] = args;

  const subArgsStr = subArgs.join(" ");
  const userData = await money.get(input.senderID);

  let { ndrive } = userData;

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
        const name = repCtx.input.body;

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

        ndrive.name = name;

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

            const res2 = `${res}\n${UNIRedux.standardLine}\n💾 NicaDrive™ Account Setup Complete! 🎉\n\n**📂 Your NicaDrive™ Features:**\n***Storage Capacity***: 0/${ndriveLimit} used\n***Instant Access***: Store and retrieve items anytime! (When it’s not updating.)\n***Secure Vault***: Your items are totally safe.\n***Smart Optimization***: We make the best use of your storage!\n\n**💾 You're all set!** Use **${prefix}ndrive** anytime to start storing and managing your items.\n${UNIRedux.standardLine}\n💎 **Upgrade to NicaDrive™ Premium?**\nWant more storage, faster retrievals, and exclusive features? Sign up for NicaDrive Premium™ today!\n\n🔹 Benefits include:\n✔️ Increased storage limit! (How much? That’s a surprise.)\n✔️ Priority item retrieval! (Less waiting)\n✔️ Exclusive support! (We might respond.)`;

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

  const opts = [
    {
      name: "view",
      icon: "📦",
      desc: "View Stored Items",
    },
    {
      name: "store",
      icon: "📥",
      desc: "Store Item(s)",
    },
    {
      name: "retrieve",
      icon: "📤",
      desc: "Retrieve Item(s)",
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
    const res = `📂 Welcome to NicaDrive™! (Because you have no choice.)\nYour Storage: ${nicaItems.size()}/${limit} used (Upgrade to NicaDrive Premium™ for more!)\n\n${items}`;

    return output.reply(res);
  }

  if (!handler.callback) {
    return output.reply(
      `🏗️🚧 Sorry, this feature is still a **work in progress.**`,
    );
  }
}

// Nica ver
export const meta = {
  name: "cassexpress",
  version: "1.3.0",
  author: "Liane Cagara | JenicaDev",
  waitingTime: 1,
  description: "[Nica Ver] Advanced and Sophisticated way of managing mails",
  category: "Finance",
  noPrefix: "both",
  otherNames: ["cexpress", "cmails"],
  requirement: "2.5.0",
  icon: "💵",
  requiredLevel: 5,
};
const charm = "✦";
const circle = "⦿";
const { parseCurrency: pCy } = global.utils;
function formatCash(amount) {
  return `$**${pCy(parseInt(amount))}**💵`;
}
function formatTime(time) {
  return global.utils.convertTimeSentence(global.utils.formatTimeDiff(time));
}
export const style = {
  title: "CassExpress | 💌",
  titleFont: "bold",
  contentFont: "fancy",
};

// LMAO u cannot convert it without actually writing the missing logic

export async function entry({
  input,
  output,
  money,
  args,
  CassExpress,
  prefix,
  Slicer,
  getInflationRate,
  CustomAI,
}) {
  const userData = await money.get(input.senderID);
  const cassExpress = new CassExpress(userData.cassExpress ?? {});
  let {
    name,
    money: userMoney,
    bankData = { bank: 0, lastInterestClaimed: Date.now() },
  } = userData;
  if (!name) {
    return output.reply(
      `💌 | Sorry, we do not accept unregistered users, please use the ${prefix}identity-setname command first!`
    );
  }
  if (!args[0]) {
    args.unshift(input.propertyArray[0]);
  }
  const targetArgs = String(args[0]);

  const ads = [`No ads available.`];
  for (let i = 0; i < 20 + Math.floor(Math.random() * 61); i++) {
    ads.sort(() => Math.random() - 0.5);
  }
  async function saveData(info, id = input.senderID) {
    return await money.set(id, info);
  }
  const ad = ads[0];
  const handlers = {
    async mails() {
      const mails = cassExpress.getMailList().toReversed();
      const slicer = new Slicer(mails);
      const paged = slicer.getPage(args[1]);
      return output.reply(
        `📪 **Your Mail Box**:\n\n${
          paged.length === 0
            ? `[ Page Empty ]`
            : paged
                .map(
                  (i, index) =>
                    `${mails.findIndex((item) => i === item) + 1}. **${
                      i.title
                    }** ${i.isRead ? "✅" : "❌"}\n${CassExpress.formatDate(
                      i.timeStamp
                    )}\n${formatTime(Date.now() - i.timeStamp)} ago.`
                )
                .join("\n\n")
        }\n\nUse ${meta.name} **readmail <index>** to read.\nUse ${
          meta.name
        } **mails <page>** to navigate through pages.\n\n${CassExpress.logo}`
      );
    },
    async readmail() {
      const mails = cassExpress.getMailList();
      const num = parseInt(args[1]);
      if (isNaN(num) || num < 1 || num > mails.length) {
        return output.reply(
          `💌 | Please enter a **valid** mail number. You currently have **${mails.length}** mails.`
        );
      }
      const mail = cassExpress.stringMailList().toReversed()[num - 1];
      const normalMail = mails.toReversed()[num - 1];
      normalMail.isRead = true;
      await saveData({
        cassExpress: cassExpress.raw(),
      });
      return output.reply(mail);
    },
  };
  const targetHandler =
    handlers[
      Object.keys(handlers).find(
        (i) => i === targetArgs || i.toLowerCase() === targetArgs.toLowerCase()
      )
    ];
  if (typeof targetHandler === "function") {
    await targetHandler();
  } else {
    return output.reply(
      `${charm} Welcome **${name}** to CassExpress, please use one of our precious services.\n\n${Object.keys(
        handlers
      )
        .map((i) => `${circle} ${prefix}${meta.name} **${i}**`)
        .join("\n")}`
    );
  }
}

import { UNIRedux } from "../modules/unisym.js";

export const meta = {
  name: "balance",
  description: "Displays your in-game balance.",
  otherNames: ["bal", "coin", "money"],
  version: "1.1.7",
  usage: "{prefix}{name}",
  category: "Fun",
  author: "Liane Cagara | JenicaDev",
  permissions: [0],
  noPrefix: "both",
  otherNames: ["bal", "coin", "cash", "money"],
  waitingTime: 6,
};

function formatNumber(number) {
  const absNumber = Math.abs(number);

  if (absNumber >= 1e21) {
    return (number / 1e21).toFixed(2) + " Sextillion";
  } else if (absNumber >= 1e18) {
    return (number / 1e18).toFixed(2) + " Quintillion";
  } else if (absNumber >= 1e15) {
    return (number / 1e15).toFixed(2) + " Quadrillion";
  } else if (absNumber >= 1e12) {
    return (number / 1e12).toFixed(2) + " Trillion";
  } else if (absNumber >= 1e9) {
    return (number / 1e9).toFixed(2) + " Billion";
  } else if (absNumber >= 1e6) {
    return (number / 1e6).toFixed(2) + " Million";
  } else if (absNumber >= 1e3) {
    return (number / 1e3).toFixed(2) + " Thousand";
  } else {
    return String(number);
  }
}

export const style = {
  title: "💰 Balance",
  titleFont: "bold",
  contentFont: "fancy",
};

function isBrokenMoney(playerMoney) {
  return !!(
    isNaN(playerMoney) ||
    !isFinite(playerMoney) ||
    playerMoney < 0 ||
    playerMoney > Number.MAX_SAFE_INTEGER
  );
}

function sortUsers(users, top) {
  let result = {};
  let sortedKeys = Object.keys(users).sort(
    (a, b) => Number(users[b].money) - Number(users[a].money),
  );
  if (top) {
    sortedKeys = sortedKeys.slice(0, top);
  }
  for (const key of sortedKeys) {
    result[key] = users[key];
  }
  return result;
}
function getTop(id, users) {
  const sorted = sortUsers(users);
  return Object.keys(sorted).findIndex((key) => key === id) + 1;
}
function totalReducer(totalObj) {
  return Object.values(totalObj).reduce((a, b) => {
    const numA = Number(a);
    const numB = Number(b);

    if (!isNaN(numA) && !isNaN(numB)) {
      return numA + numB;
    } else {
      return numA;
    }
  }, 0);
}
const { parseCurrency: pCy } = global.utils;

/**
 * @type {CommandEntry}
 */
export async function entry({
  money,
  input,
  output,
  icon,
  prefix,
  clearCurrStack,
}) {
  output.prepend = UNIRedux.arrow;
  
  if (input.arguments[0] === "reset_force_confirmed") {
    await money.set(input.senderID, { money: 0 });
    output.reply(`Your balance has been reset to 0$`);
    return;
  }
  if (input.arguments[0] === "fix") {
    const { money: playerMoney } = await money.get(input.senderID);
    if (isBrokenMoney(playerMoney)) {
      await money.set(input.senderID, { money: 0 });
      return output.reply(
        `Your broken balance has been reset from ${pCy(playerMoney)} to 0$`,
      );
    } else {
      return output.reply(
        `Your balance is ${pCy(playerMoney)}$ and not broken at all.`,
      );
    }
  }
  if (input.arguments[0] === "top") {
    let { participantIDs = [] } = input;
    if (!Array.isArray(participantIDs)) {
      participantIDs = [];
    }
    const allData = await money.getAll();

    const topList = Object.entries(allData)
      .filter(([uid, data]) => data.name && data.money !== undefined)
      .sort((a, b) => b[1].money - a[1].money)
      .slice(0, 10);

    const formattedTopList = topList.map(([uid, data], index) => {
      const { name, money: userMoney, exp } = data;

      return `${index + 1}. ${name} 💰\n${formatNumber(userMoney)}\n`;
    });

    const response = formattedTopList.length
      ? `💰 Top 10 List:\n${formattedTopList.join("\n")}`
      : "No data available for the top list.";

    return output.replyStyled(response, {
      ...style,
      title: "🏆 Richest Balance",
    });
  }

  let { senderID } = input;
  if (input.replier) {
    ({ senderID } = input.replier);
  }
  if (input.hasMentions) {
    ({ senderID } = input.firstMention);
  }
  if (input.arguments[0]) {
    senderID = input.arguments[0];
  }

  if (senderID !== input.senderID) {
    const hisData = await money.get(input.messageReply.senderID);
    if (!hisData) {
      return output.reply(`${name} is not yet registered in our system.`);
    }
    const { name, money: userMoney } = hisData;

    output.reply(`${name} has ${userMoney ?? 0} coins.`);
  } else {
    const data = await money.get(input.senderID);
    if (!data) {
      return output.reply(`You are not yet registered in our system.`);
    }
    const { name, money: userMoney } = data;

    output.reply(`You have ${userMoney ?? 0} coins.`);
  }
}

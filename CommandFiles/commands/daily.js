import { UNIRedux } from "../modules/unisym.js";

export const meta = {
  name: "daily",
  description: "Claim your daily reward!",
  version: "1.0.0",
  author: "Liane Cagara",
  category: "Rewards",
  permissions: [0],
  noPrefix: false,
  requirement: "2.5.0",
  icon: "💎",
};
export const style = {
  title: "Daily Reward 💗",
  titleFont: "bold",
  contentFont: "fancy",
};

/**
 *
 * @type {CommandEntry}
 */
export async function entry({
  input,
  output,
  money,
  Collectibles,
  CassExpress,
  CassEXP,
}) {
  let {
    money: userMoney,
    lastDailyClaim,
    collectibles,
    battlePoints = 0,
    cassExpress = {},
    cassEXP: cxp,
    name = "Unregistered",
  } = await money.get(input.senderID);
  let cassEXP = new CassEXP(cxp);
  cassExpress = new CassExpress(cassExpress);
  collectibles = new Collectibles(collectibles);

  const currentTime = Date.now();
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

  let canClaim = false;

  if (!lastDailyClaim) {
    canClaim = true;
  } else {
    const timeElapsed = currentTime - lastDailyClaim;
    if (timeElapsed >= oneDayInMilliseconds) {
      canClaim = true;
    } else if (input.isAdmin && input.arguments[0] === "cheat") {
      canClaim = true;
    } else {
      const timeRemaining = oneDayInMilliseconds - timeElapsed;
      const hoursRemaining = Math.floor(
        (timeRemaining / (1000 * 60 * 60)) % 24
      );
      const minutesRemaining = Math.floor((timeRemaining / 1000 / 60) % 60);
      const secondsRemaining = Math.floor((timeRemaining / 1000) % 60);

      output.reply(
        `⏳ You've already claimed your daily reward. Please wait for ${hoursRemaining} hours, ${minutesRemaining} minutes, and ${secondsRemaining} seconds before claiming again.`
      );
      return;
    }
  }
  const elapsedTime = currentTime - (lastDailyClaim || Date.now());
  const claimTimes = Math.max(
    1,
    Math.floor(elapsedTime / oneDayInMilliseconds)
  );
  const dailyReward = 100 * claimTimes;
  collectibles.raise("gems", claimTimes);
  const extraEXP = claimTimes * cassEXP.level * 5;

  if (canClaim) {
    cassExpress.createMail({
      title: `Daily Reward Claimed`,
      author: input.senderID,
      body: `Congratulations **${name}** for claiming your daily reward!`,
      timeStamp: Date.now(),
    });

    cassEXP.expControls.raise(extraEXP);
    await money.set(input.senderID, {
      money: userMoney + dailyReward,
      lastDailyClaim: currentTime,
      battlePoints: battlePoints + Math.floor(dailyReward / 10),
      collectibles: Array.from(collectibles),
      cassExpress: cassExpress.raw(),
      cassEXP: cassEXP.raw(),
    });

    output.reply(
      `${
        UNIRedux.charm
      } You've claimed your daily reward! Come back tomorrow for more.\n\n🧪 **x${extraEXP}** Experience Points (exp)\n💵 **x${dailyReward.toLocaleString()}** Money (money)\n💶 **x${Math.floor(
        dailyReward / 10
      ).toLocaleString()}** Pet Points (battlePoints)`
    );
  }
}

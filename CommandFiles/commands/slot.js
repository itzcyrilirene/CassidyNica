export const meta = {
  name: "slots",
  description: "Play a slot game and try your luck!",
  author: "JenicaDev",
  version: "1.0.1",
  usage: "{prefix}{name} <bet>",
  category: "Gambling Games",
  permissions: [0],
  noPrefix: "both",
  otherNames: ["slot"],
  waitingTime: 5,
  requirement: "2.5.0",
  icon: "🍒",
};
export const style = {
  title: "🎰 Slot Game",
  titleFont: "bold",
  contentFont: "fancy",
};
/**
 * @type {CommandEntry}
 */
export async function entry({ input, output, money: botData, cancelCooldown }) {
  try {
    const bet = parseInt(input.arguments[0]);
    if (isNaN(bet) || bet <= 0) {
      cancelCooldown();
      await output.reply(`Please enter a valid bet larger than 0.`);
      return;
    }
    const { money: userMoney } = await botData.get(input.senderID);
    if (bet > userMoney) {
      cancelCooldown();
      await output.reply(`You don't have enough money to make this bet!`);
      return;
    }
    const fruits = [
      ...new Set([
        "🍎",
        "🍊",
        "🍌",
        "🍒",
        "🍇",
        "🍒",
        "🍋",
        "🍊",
        "💀",
        "✨",
        "🚀",
        "👑",
      ]),
    ];

    const result = [];
    for (let i = 0; i < 3; i++) {
      const randomFruit = fruits[Math.floor(Math.random() * fruits.length)];
      result.push(randomFruit);
    }

    let wins = 0;

    let winMessage = "";
    if (result[0] === result[1] && result[1] === result[2]) {
      const winAmount = bet * 3;
      wins += winAmount;
      winMessage = `Congratulations! You won ${winAmount} coins!`;
    } else if (
      result[0] === result[1] ||
      result[1] === result[2] ||
      result[0] === result[2]
    ) {
      const winAmount = bet * 2;
      wins += winAmount;
      winMessage = `You won ${winAmount} coins!`;
    } else {
      wins -= bet;
      winMessage = `Sorry, you didn't win. ${bet} coins have been deducted.`;
    }

    const resultMessage = `Slot Result: ${result.join(" | ")}`;
    await botData.set(input.senderID, {
      money: userMoney + wins,
    });
    await output.reply(`${resultMessage}\n${winMessage}`);
  } catch (error) {
    return output.error(error);
  }
}

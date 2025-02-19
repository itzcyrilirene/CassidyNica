import { ReduxCMDHome } from "../modules/reduxCMDHome.js";

export const meta = {
  name: "api",
  description: "Cassidy's Developer API!",
  author: "Liane Cagara",
  version: "1.1.3",
  usage: "{prefix}inventory <action> [args]",
  category: "Finance",
  permissions: [0],
  noPrefix: false,
  waitingTime: 1,
  otherNames: ["devapi", "cassapi"],
  requirement: "2.5.0",
  icon: "💻",
};

export const style = {
  title: "CassAPI 💻",
  titleFont: "bold",
  contentFont: "none",
};

export async function entry(ctx) {
  const { args, prefix, commandName, output } = ctx;
  const handler = handlers[args[0]] ?? handlers[String(args[0]).toLowerCase()];
  if (typeof handler === "function") {
    args.shift();
    return handler(ctx);
  }
  let result = `✦ Welcome to **Cassidy's Developer API!** Here you are able to **access** and **test out** most of developer related api's, including but not limited to:\n\n`;
  for (const [key] of Object.entries(handlers)) {
    result += `${prefix}${commandName} ${key}\n`;
  }
  return output.reply(result);
}

/**
 * @type {Record<string, CommandEntry>}
 */
const handlers = {
  async redux_demo(ctx) {
    const home = new ReduxCMDHome(
      {
        isHypen: false,
        argIndex: 1,
      },
      [
        {
          key: "option1",
          async handler({ output }) {
            output.reply("This is option 1!");
          },
        },
        {
          key: "option2",
          description: "This is the second option.",
          async handler({ output }) {
            output.reply("This is option 2!");
          },
        },
        {
          key: "option3",
          description: "This is the third option.",
          args: ["<arg1>", "[arg2]"],
          async handler({ output }) {
            output.reply("This is option 3!");
          },
        },
      ]
    );

    home.runInContext(ctx);
  },
  async file(ctx) {
    const neax = new ctx.NeaxUI(ctx);
    neax.menuBarOpts.add("File", "Edit", "View", "Help");

    neax.onMenuBar("File", ({ cassIO }) => {
      cassIO.out("Bruh File");
    });

    neax.onMenuBar("Edit", ({ cassIO }) => {
      cassIO.out("What are you gonna edit lmao");
    });

    neax.onMenuBar(":nohandler", ({ cassIO }) => {
      cassIO.out("Invalid option!");
    });

    neax.replyListen(
      {
        content: `Welcome to the **file** manager! This does not work for now.`,
      },
      () => true
    );
  },
  async invjson({ input, money, output, args, Inventory }) {
    const userData = await money.get(input.senderID);
    const inventory = new Inventory(userData.inventory);
    const targetItem = inventory.getOne(args[0]);
    if (!targetItem) {
      return output.reply(
        `⚠️ | Enter an **item key** to check. Make sure it exists in your inventory.`
      );
    }
    const jsonStr = JSON.stringify(targetItem, null, 2);
    return output.reply(
      `📄 | Here is the **JSON** of the item you requested:\n\n${jsonStr}`
    );
  },
  async style({ input, output, args }) {
    const jsonData = JSON.parse(args.join(" "));
    const styled = new output.Styled({
      ...jsonData,
    });
    await styled.reply("This is an example content.");
  },
  async petjson({ input, money, output, args, Inventory }) {
    const userData = await money.get(input.senderID);
    const petsData = new Inventory(userData.petsData);
    const targetPet = petsData
      .getAll()
      .find(
        (i) =>
          String(i?.name).toLowerCase().trim() ===
          String(args[0]).toLowerCase().trim()
      );
    if (!targetPet) {
      return output.reply(
        `⚠️ | Enter a **pet name** to check. Make sure it exists in your pet list.`
      );
    }
    const jsonStr = JSON.stringify(targetPet, null, 2);
    return output.reply(
      `📄 | Here is the **JSON** of the pet you requested:\n\n${jsonStr}`
    );
  },
  async cmdmetajson({ input, output, commands, args }) {
    const command =
      commands[args[0]] ?? commands[String(args[0]).toLowerCase()];
    if (!command) {
      return output.reply(`⚠️ | Enter a valid **command name** to check.`);
    }
    const jsonStr = JSON.stringify(command.meta, null, 2);
    return output.reply(
      `📄 | Here is the **JSON** of the command meta you requested:\n\n${jsonStr}`
    );
  },
  async allpetsjson({ input, money, output, args, Inventory }) {
    const userID =
      (args[0] === "self" ? input.senderID : args[0]) ||
      input.replier?.senderID;
    if (!args[0]) {
      return output.reply("⚠️ | Enter a **gameid** or **self** to start.");
    }
    const userData = await money.get(userID);
    const petsData = new Inventory(userData.petsData);
    const jsonStr = JSON.stringify(petsData, null, 2);
    return output.reply(
      `📄 | Here is the **JSON** of the pets you requested:\n\n${jsonStr}`
    );
  },
  async eventjson({ input: { ...input }, output }) {
    delete input.password;
    return output.reply(
      `📄 | The **JSON** below contains the **most important** data that the **cassidy system** processes:\n\n` +
        JSON.stringify(input, null, 2)
    );
  },
  async reqitem({ input, output, args, money }) {
    const adminData = await money.get("wss:admin");
    if (args.length === 0) {
      return output.reply(
        `📄 | Please **provide** a **JSON** string to request an item to the **developer**.`
      );
    }

    let itemData;
    try {
      itemData = JSON.parse(args.join(" "));
    } catch (e) {
      return output.reply(
        `⚠️ | Invalid JSON format. Please provide a valid JSON string.`
      );
    }

    const { key, icon, flavorText, name, type, sellPrice } = itemData;

    if (!key || !icon || !flavorText || !name || !type || !sellPrice) {
      return output.reply(
        `⚠️ | Missing important required fields. Ensure your JSON includes "key", "icon", "flavorText", "type", "sellPrice" and "name".`
      );
    }
    adminData.requestItems ??= [];
    adminData.requestNum ??= 0;
    adminData.requestNum++;
    adminData.requestItems.push({
      author: input.senderID,
      itemData,
      creationTime: Date.now(),
      requestNum: adminData.requestNum,
    });
    const jsonStr = JSON.stringify(itemData, null, 2);

    await money.set("wss:admin", {
      requestItems: adminData.requestItems,
      requestNum: adminData.requestNum,
    });
    return output.reply(
      `📄✅ | Thank you for your **request**! The item you created has been successfully sent to the **developer** for review, it might be added to the bot soon if it is able to meet the requirements.\n\n**JSON Recap**:\n\n${jsonStr}`
    );
  },

  async reqitemlist({ input, output, money, Inventory, Slicer, args }) {
    const adminData = await money.get("wss:admin");
    const allData = await money.getAll();
    const items = Array.from(adminData.requestItems);
    /*if (items.length === 0) {
      return output.reply(`📄 | No items here : (`);
    }*/
    let result = "";
    const slicer = new Slicer(items.reverse(), 5);
    for (const itemReq of slicer.getPage(args[0])) {
      if (!itemReq.author || !itemReq.itemData) {
        continue;
      }
      const item = itemReq.itemData;
      const userData = allData[itemReq.author];
      if (args.includes("--json")) {
        result += `${item.icon} **${item.name}** (${item.key}) #${
          itemReq.requestNum ?? "??"
        }
By **${userData.name ?? "Unregistered"}**

${JSON.stringify(item, null, 2)}\n\n`;
      } else {
        result += `${item.icon} **${item.name}** (${item.key}) #${
          itemReq.requestNum ?? "??"
        }
By **${userData.name ?? "Unregistered"}**
***Info:***
${item.flavorText ?? "Not Configured"}
***Type:*** ${item.type ?? "Not Configured"}
***Sell Price:*** ${item.sellPrice ?? "Not Configured"}
***ATK***: ${item.atk ?? "Not Configured"}
***DEF***: ${item.def ?? "Not Configured"}
***MAGIC***: ${item.magic ?? "Not Configured"}
***Saturation***: ${item.saturation ?? "Not Configured"}
***Author ID*** ${itemReq.author}\n\n`;
      }
    }
    return output.reply(
      `📄 | **Requested Items:** (newest first.)\n\n${result.trim()}\n\nType **api reqitemlist <page>*** to navigate through the pages. You can also use tag **--json** to view json.`
    );
  },
  async pet_test({
    input,
    output,
    args,
    money,
    Inventory,
    GearsManage,
    PetPlayer,
    WildPlayer,
  }) {
    const userData = await money.get(input.senderID);
    function getInfos(data) {
      const gearsManage = new GearsManage(data.gearsData);
      const petsData = new Inventory(data.petsData);
      const playersMap = new Map();
      for (const pet of petsData) {
        const gear = gearsManage.getGearData(pet.key);
        const player = new PetPlayer(pet, gear);
        playersMap.set(pet.key, player);
      }
      return {
        gearsManage,
        petsData,
        playersMap,
      };
    }
    const { gearsManage, petsData, playersMap } = getInfos(userData);
    let [targetName, enemyAtk, enemyDef, enemyHP] = args;
    enemyAtk = parseInt(enemyAtk);
    enemyDef = parseInt(enemyDef);
    enemyHP = parseInt(enemyHP);
    if (!targetName || isNaN(enemyAtk) || isNaN(enemyDef) || isNaN(enemyHP)) {
      return output.reply(
        `**Guide**: <your-pet-name> <enemy-atk> <enemy-def> <enemy-hp>`
      );
    }
    const petKey = petsData.findKey(
      (i) => String(i?.name).toLowerCase() === String(targetName).toLowerCase()
    );
    const player = playersMap.get(petKey);
    const gear = gearsManage.getGearData(petKey);
    if (!player) {
      return output.reply(
        `⚠️ | Please enter a pet name that **exists** in your pet list.`
      );
    }
    const opponent = new WildPlayer({
      wildName: "Test Opponent",
      wildIcon: "🤖",
      wildType: "robot",
      HP: enemyHP,
      ATK: enemyAtk,
      DF: enemyDef,
    });
    function makeUI() {
      return `${opponent.getPlayerUI()}\nATK ${opponent.ATK} DEF ${
        opponent.DF
      } \n\n${player.getPlayerUI()}\nATK ${player.ATK} DEF ${player.DF} MAGIC ${
        player.MAGIC
      }\n\nOptions:\n**attack**\n**take single**\n**take thirds**\n**take half**`;
    }
    const author = input.senderID;
    async function handleInput({ output, input }) {
      if (input.senderID !== author) return;
      const args = input.words;
      function detect(...actions) {
        return actions.every((a, ind) => a === args[ind]);
      }
      function handleEnd(id, { ...extras } = {}) {
        input.setReply(id, {
          key: "api",
          callback: handleInput,
          ...extras,
        });
      }
      const option = String(args[0]).toLowerCase();
      const subOption = String(args[1]).toLowerCase();
      if (option === "attack") {
        const damage = player.calculateAttack(opponent.DF);
        opponent.HP -= damage;
        const i = await output.replyStyled(
          `${player.petIcon} **${
            player.petName
          }** dealth **${damage}** damage.\n\n${makeUI()}`,
          style
        );
        handleEnd(i.messageID);
      } else if (option === "take") {
        let damage = player.calculateTakenDamage(opponent.ATK);
        if (subOption === "thirds") {
          damage /= 3;
        }
        if (subOption === "half") {
          damage /= 2;
        }
        damage = Math.floor(damage);

        player.HP -= damage;
        const i = await output.replyStyled(
          `${player.petIcon} **${
            player.petName
          }** has taken **${damage}** damage.\n\n${makeUI()}`,
          style
        );
        handleEnd(i.messageID);
      } else {
        return output.replyStyled(
          `⚠️ | Please go back and reply a valid option.`,
          style
        );
      }
    }
    const i = await output.replyStyled(makeUI(), style);
    input.setReply(i.messageID, {
      key: "api",
      callback: handleInput,
    });
  },
  async btest({ input, output, api }) {},
};

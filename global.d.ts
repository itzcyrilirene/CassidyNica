import type * as Cass from "cassidy-userData";
import type {
  Inventory,
  Collectibles,
} from "./CommandFiles/plugins/ut-shop.js";

import type InputX from "input-cassidy";
import type OutputX from "output-cassidy";
import { CassEXP } from "./CommandFiles/modules/cassEXP.js";
import type {
  GameSimulator,
  GameSimulatorProps,
  Item,
} from "./CommandFiles/types/gamesimu.d.ts";
import GlobalUtilsX from "./utils-type";

export {};

declare global {
  interface FactoryConfig {
    title: string;
    key: string;
    init: {
      slot: number;
      proc: number;
    };
    upgrades: {
      slot: number;
      proc: number;
    };
    recipes: Recipe[];
  }

  interface Recipe {
    name: string;
    icon: string;
    levelRequirement: number;
    waitingTime: number;
    ingr: IngredientGroup[];
    result: RecipeResult;
  }

  type IngredientGroup = Ingredient | Ingredient[];

  interface Ingredient {
    name: string;
    icon: string;
    amount: number;
    key: string;
  }
  interface InventoryConstructor extends Inventory {}
  interface GameSimulatorConstructor extends GameSimulator {}

  interface CommandContext {
    [key: string]: any;
    money: Cass.UserStatsManager;
    Inventory: typeof Inventory;
    Collectibles: typeof Collectibles;
    input: InputX;
    output: OutputX;
    args: string[];
    cancelCooldown?: Function;
    commandName?: string;
    prefix: string;
    prefixes: string[];
    commands: { [key: string]: any };
    CassEXP: typeof CassEXP;
    userDataCache: UserData;
    GameSimulator: typeof GameSimulator;
  }

  interface RecipeResult extends Cass.InventoryItem {}
  type CommandEntry = (ctx: CommandContext) => any | Promise<any>;

  type UserData = Cass.UserData;

  var utils: typeof GlobalUtilsX;
}

import type { UserStatsManager } from "cassidy-userData";

declare global {
  var Cassidy: {
    config: {
      get: () => any;
      set: (data: any) => void;
    };
    uptime: number;
    plugins: any[];
    commands: any[];
    invLimit: number;
    presets: Map<any, any>;
    loadCommand: Function;
    loadPlugins: Function;
    loadAllCommands: Function;
    readonly logo: any;
    oldLogo: string;
    accessToken: string | null;
    readonly redux: boolean;
    readonly highRoll: 10_000_000;
  };
  var handleStat: UserStatsManager;
}

export {};

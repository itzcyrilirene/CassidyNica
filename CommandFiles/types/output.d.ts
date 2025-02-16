/*
  WARNING: This source code is created by Liane Cagara.
  Any unauthorized modifications or attempts to tamper with this code 
  can result in severe consequences, including a global ban from my server.
  Proceed with extreme caution and refrain from any unauthorized actions.
*/

declare module "output-cassidy" {
  interface OutputProps {
    reply(body: string, callback?: (info: any) => void): Promise<any>;
    contact(text: string, id?: string, destination?: string): Promise<boolean>;
    error(err: string | Error, callback?: (info: any) => void): Promise<any>;
    send(
      body: string,
      id?: string,
      callback?: (info: any) => void
    ): Promise<any>;
    add(user: string, thread?: string): void;
    kick(user: string, thread?: string): void;
    unsend(mid: string): void;
    reaction(emoji: string, mid?: string): void;
    prepend: string;
    append: string;
    replyStyled(body: string, style: any, thread: string): Promise<any>;
    sendStyled(body: string, style: any, thread: string): Promise<any>;
    Styled: {
      new (style: any): {
        style: any;
        lastID: string | null;
        reply(body: string): Promise<any>;
        send(body: string): Promise<any>;
        edit(body: string, messageID: string, delay?: number): Promise<any>;
      };
    };
    wentWrong(): Promise<any>;
    syntaxError(commandX?: any): Promise<any>;
    edit(
      text: string,
      mid: string,
      delay?: number,
      style?: any
    ): Promise<boolean>;
    frames(...args: (string | number)[]): Promise<any>;
    react(emoji: string, mid?: string): void;
    formatError(err: string | Error): string;
    confirm(body: string, done?: CommandEntry): Promise<CommandContext>;
  }

  export default OutputProps;
}

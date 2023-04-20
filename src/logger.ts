import { Logger } from "@comunica/types";

export class ConsoleLogger extends Logger {
  private readonly level: string;
  private readonly levelOrdinal: number;
  private readonly actors?: Record<string, boolean>;

  public constructor(args: IConsoleLoggerArgs) {
    super();
    this.level = args.level;
    this.levelOrdinal = Logger.getLevelOrdinal(this.level);
    this.actors = args.actors;
  }

  public debug(message: string, data?: any): void {
    this.log("debug", message, data);
  }

  public error(message: string, data?: any): void {
    this.log("error", message, data);
  }

  public fatal(message: string, data?: any): void {
    this.log("fatal", message, data);
  }

  public info(message: string, data?: any): void {
    this.log("info", message, data);
  }

  public trace(message: string, data?: any): void {
    this.log("trace", message, data);
  }

  public warn(message: string, data?: any): void {
    this.log("warn", message, data);
  }

  protected log(
    level: "debug" | "error" | "fatal" | "info" | "trace" | "warn",
    message: string,
    data?: any
  ): void {
    if (
      Logger.getLevelOrdinal(level) >= this.levelOrdinal &&
      (!data || !("actor" in data) || !this.actors || this.actors[data.actor])
    ) {
      const consoleMethod = level === "fatal" ? "error" : level;
      console[consoleMethod](`${level}:`, message, data);
    }
  }
}

export interface IConsoleLoggerArgs {
  /**
   * The minimum logging level.
   */
  level: string;
  /**
   * A whitelist of actor IRIs to log for.
   */
  actors?: Record<string, boolean>;
}

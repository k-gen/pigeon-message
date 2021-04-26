import * as dotenv from "dotenv";

const config = dotenv.config().parsed!;

Object.keys(config).forEach((key) => {
  process.env[key] = config[key];
});

export namespace Config {
  export namespace Slack {
    export const APP_TOKEN = process.env.SLACK_APP_TOKEN as string;
    export const BOT_TOKEN = process.env.SLACK_BOT_TOKEN as string;
    export const USER_TOKEN = process.env.SLACK_USER_TOKEN as string;
    export const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET as string;

    export namespace Bolt {
      export const SERVE_PORT = parseInt(process.env.SLACK_PORT || "8080", 10);
      export const DEBUG_USER = process.env.BOLT_DEBUG_USER_ID as string;
    }
  }

  export namespace General {
    export const { APP_ENV } = process.env;
    export const APP_ENV_TYPE = {
      LOCAL: "local",
      DEV: "dev",
      PRD: "prod",
    };
    // NOTE: Union Types いらないかな？、一旦書いとく（いらないなら消しておk）
    // export type DETECTED_APP_ENV = typeof APP_ENV_TYPE[keyof typeof APP_ENV_TYPE];
  }
}

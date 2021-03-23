import { App, LogLevel, ExpressReceiver } from "@slack/bolt";
import {Config} from "../config";

export const receiver = new ExpressReceiver({
  signingSecret: Config.Slack.SIGNING_SECRET,
});

const args = {
  logLevel: LogLevel.DEBUG,
  token: Config.Slack.BOT_TOKEN,
  signingSecret: Config.Slack.SIGNING_SECRET,
  receiver,
};

export const app = new App(args);

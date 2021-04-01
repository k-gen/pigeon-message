import pkg from '@slack/bolt';
const { App, LogLevel, ExpressReceiver } = pkg;
import { Config } from "../config.js";

export const receiver = new ExpressReceiver({
  signingSecret: Config.Slack.SIGNING_SECRET,
});

const args = {
  socketMode: true,
  logLevel: LogLevel.DEBUG,
  appToken: Config.Slack.APP_TOKEN,
  token: Config.Slack.BOT_TOKEN,
  signingSecret: Config.Slack.SIGNING_SECRET,
  // receiver,
};

export const app = new App(args);

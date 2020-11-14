const { App } = require('@slack/bolt');
const { jsxslack } = require('@speee-js/jsx-slack');
require('dotenv').config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.event('app_home_opened', async ({ context, event, say }) => {
    const history = await app.client.conversations.history({
        token: context.botToken,
        channel: event.channel,
        count: 1,
    });

    if (history.messages.length === 0) {
        say({
        blocks: jsxslack`
            <Blocks>
            <Section>
                <p><b>伝書鳩アプリへようこそ！</b></p>
                <p>指定した日時に、ユーザーへの伝言を送信します。🕊️</p>
            </Section>
            <Actions>
                <Button name="post" style="primary">伝言を送る...</Button>
            </Actions>
            </Blocks>
        `,
        });
    }
});

const modal = (props = {}) => jsxslack`
    <Modal title="伝言を送る" callbackId="post">
        <Section>
            私にお任せ下さい！
            <Image src="https://source.unsplash.com/ic-13C3QhAI/256x256" alt="鳩" />
        </Section>
    </Modal>
`

app.action('post', ({ ack, body, context }) => {
    ack();

    app.client.views.open({
        token: context.botToken,
        trigger_id: body.trigger_id,
        view: modal(),
    });
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();
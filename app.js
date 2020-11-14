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

const options = (count, start, suffix) => {
    return [...Array(count)].map((_, i) => {
        const s = (i + start).toString();
        return jsxslack`
            <Option value="${s}">${s.padStart(2, '0')}${suffix}</Option>
        `
    });
};

const TimePicker = props => jsxslack`
    <Section>
        <b>${props.label}</b>
    </Section>
    <Actions id="${props.id}">
        <Select name="hour" value="${props.hour}" placeholder="時">
            <Optgroup label="午前">${options(12, 0, '時')}</Optgroup>
            <Optgroup label="午後">${options(12, 12, '時')}</Optgroup>
        </Select>
        <Select name="minute" value="${props.minute}" placeholder="分">
            ${options(60, 0, '分')}
        </Select>
    </Actions>

    <!-- error message -->
    ${props.error & jsxslack`<Context>:warning: <b>${props.error}</b></Context>`}

    <Input type="hidden" name="hour" value="${props.hour}" />
    <Input type="hidden" name="minute" value="${props.minute}" />
`

const modal = props => jsxslack`
    <Modal title="伝言を送る" callbackId="post">
        <Section>
            私にお任せ下さい！
            <Image src="https://source.unsplash.com/ic-13C3QhAI/256x256" alt="鳩" />
        </Section>

        <Textarea id="message" name="message" label="伝言" placeholder="伝言をどうぞ…" required />
        <UsersSelect id="users" name="users" label="送付先" multiple required />
        <DatePicker id="date" name="date" label="日付" required />

        <${TimePicker}
            id="time"
            label="時刻"
            hour="${props.hour}"
            minute="${props.minute}"
            error="${props.timePickerError}"
        />

        <Input type="hidden" name="userId" value="${props.userId}" />
    </Modal>
`

app.action('post', ({ ack, body, context }) => {
    ack();

    app.client.views.open({
        token: context.botToken,
        trigger_id: body.trigger_id,
        view: modal({ userId: body.user.id }),
    });
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();
const { App } = require('@slack/bolt');
const { jsxslack } = require('@speee-js/jsx-slack');
const { dayjs } = require('dayjs/locale/ja');
require('dotenv').config();

const app = new App({
  socketMode: process.env.APP_ENV === 'local' ? true : false,
  appToken: process.env.SLACK_APP_TOKEN,
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

const options = (count, start, suffix, current) => {
    return [...Array(count)].map((_, i) => {
        const s = (i + start).toString();
        return jsxslack`
            <Option ${s === current ? "selected=true " : ""} value="${s}">${s.padStart(2, '0')}${suffix}</Option>
        `
    });
};


const now = dayjs();

// TODO: dayjs を使って現在時刻を selected にする #15
const TimePicker = props => jsxslack`
    <Section>
        <b>${props.label}</b>
    </Section>
    <Actions id="${props.id}">
        <Select name="hour" value="${props.hour}" placeholder="時">
            <Optgroup label="午前">${options(12, 0, '時', now.hour())}</Optgroup>
            <Optgroup label="午後">${options(12, 12, '時', now.hour())}</Optgroup>
        </Select>
        <Select name="minute" value="${props.minute}" placeholder="分">
            ${options(60, 0, '分', now.minute())}
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
        <ConversationsSelect
            id="channel"
            name="channel"
            label="チャンネル"
            required
            include="public im"
            excludeBotUsers
            responseUrlEnabled
        />
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

app.shortcut('open_modal', ({ ack, body, context }) => {
    ack();

    app.client.views.open({
        token: context.botToken,
        trigger_id: body.trigger_id,
        view: modal({ userId: body.user.id }),
    });
});

app.action(/^(hour|minute)$/, ({ ack, body, context, payload }) => {
    ack();

    app.client.views.update({
        token: context.botToken,
        view_id: body.view.id,
        view: modal({
            ...JSON.parse(body.view.private_metadata),
            [payload.action_id]: payload.selected_option.value,
        }),
    });
});

app.view('post', ({ ack, context, next, view }) => {
    // バリデーション処理
    const values = {
        ...JSON.parse(view.private_metadata),
        message: view.state.values.message.message.value,
        users: view.state.values.users.users.selected_users,
        channel: view.state.values.channel.channel.selected_conversation,
        date: view.state.values.date.date.selected_date,
    }

    if (values.hour && values.minute) {
        ack();

        // 次のミドルウェアに値を渡す
        context.values = values
        next();
    } else {
        ack({
          response_action: 'update',
          view: modal({
            ...JSON.parse(view.private_metadata),
            timePickerError: '時刻を入力してください。',
          }),
        });
    }
},
async ({ context }) => {
    // 投稿処理
    const { values } = context;
    const { date, hour, minute } = values;

    const postAt = new Date(`${date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00+0900`)  / 1000;
    const displayDatetimeText = dayjs(`${value.date} ${value.hour}:${value.min}:00`).format('YYYY年MM月DD日 HH:MM:ss')
    const messageOption = {
        token: context.botToken,
        channel: values.channel,
        unfurl_links: true,
        text: ''
    }

    for (const user of values.users) {
        let scheduledMessageId;

        try {
            messageOption.post_at = postAt;
            messageOption.text = `${values.message}`;
            messageOption.blocks = jsxslack`
                <Blocks>
                    <Section>
                        <a href="@${user}" />さんへの伝書をお届けします 🕊️
                    </Section>
                    <Divider />
                    <Section>
                        <Mrkdwn>${values.message}</Markdwn>
                    </Section>
                </Blocks>
            `
            scheduledMessageId = (await app.client.chat.scheduleMessage(messageOption)).scheduled_message_id;
            delete messageOption.post_at;
            delete messageOption.text;
        } catch (e) {
            messageOption.text = `おっと！ <!${user}> さんへの伝書をお届けできないようです :sob:`,
            messageOption.channel = values.userId;
            messageOption.blocks = jsxslack`
                <Blocks>
                    <Section>
                        おっと！ <a href="@${user}" /> さんへの伝書をお届けできないようです :sob:
                    </Section>
                    <Context>
                        <b>エラー内容：</b><span>${e.message}</span>
                    </Context>
                </Blocks>
            `
            await app.client.chat.postMessage(messageOption);
            delete messageOption.text;
            continue
        }

        messageOption.channel = values.userId;
        messageOption.text = `${displayDatetimeText}分に<@${user}>さんへ伝書をお届けします 🕊️`;
        messageOption.blocks = jsxslack`
            <Blocks>
                <Section>
                    <time datetime=${postAt}>{date} {time}</time> に <a href="@${user}" /> さんへ伝書をお届けします 🕊️
                </Section>
                <Context>
                    <b>ID:</b><span>${scheduledMessageId}</span>
                </Context>
            </Blocks>
        `

        await app.client.chat.postMessage(messageOption);
    }
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();
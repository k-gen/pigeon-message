import { App, LogLevel, SlackActionMiddlewareArgs, AllMiddlewareArgs, BlockAction, StaticSelectAction } from '@slack/bolt';
import { ChatScheduleMessageArguments } from '@slack/web-api';
import { jsxslack } from '@speee-js/jsx-slack';
import dayjs from 'dayjs';
import * as dotenv from 'dotenv';
dotenv.config();

const app = new App({
  socketMode: process.env.APP_ENV === 'local' ? true : false,
  appToken: process.env.SLACK_APP_TOKEN,
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.DEBUG,
});

app.event('app_home_opened', async ({ context, event, say }) => {
    const history = await app.client.conversations.history({
        token: context.botToken,
        channel: event.channel,
        count: 1,
    });

    if (history.response_metadata?.messages?.length === 0 ) {
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
        text: ''
        });
    }
});

const options = (count, start, suffix, current) => {
    return [...Array(count)].map((_, i) => {
        const s = (i + start).toString();
        if (s === current.toString()) {
            return jsxslack`
                <Option value="${s}" selected>${s.padStart(2, '0')}${suffix}</Option>
            `
        } else {
            return jsxslack`
                <Option value="${s}">${s.padStart(2, '0')}${suffix}</Option>
            `
        }
    });
};


// TODO: dayjs を使って現在時刻を selected にする #15
const TimePicker = props => jsxslack`
    <Section>
        <b>${props.label}</b>
    </Section>
    <Actions id="${props.id}">
        <Select name="hour" value="${props.hour}" placeholder="時">
            <Optgroup label="午前">${options(12, 0, '時', dayjs().hour())}</Optgroup>
            <Optgroup label="午後">${options(12, 12, '時', dayjs().hour())}</Optgroup>
        </Select>
        <Select name="minute" value="${props.minute}" placeholder="分">
            ${options(60, 0, '分', dayjs().minute())}
        </Select>
    </Actions>

    <!-- error message -->
    ${props.error && jsxslack`<Context>:warning: <b>${props.error}</b></Context>`}

    <Input type="hidden" name="hour" value="${props.hour ? props.hour : dayjs().hour().toString()}" />
    <Input type="hidden" name="minute" value="${props.minute ? props.minute : dayjs().hour().toString()}" />
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
        <DatePicker id="date" name="date" label="日付" initialDate="${dayjs().toDate()}" required />

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

app.action('post', async ({ ack, body, context }: SlackActionMiddlewareArgs<BlockAction<StaticSelectAction>> & AllMiddlewareArgs) => {
    await ack();

    app.client.views.open({
        token: context.botToken,
        trigger_id: body.trigger_id,
        view: modal({ userId: body.user.id }),
    });
});

app.shortcut('open_modal', async ({ ack, body, context }) => {
    await ack();

    app.client.views.open({
        token: context.botToken,
        trigger_id: body.trigger_id,
        view: modal({ userId: body.user.id }),
    });
});

app.action(/^(hour|minute)$/, async ({ ack, body, context, payload }: SlackActionMiddlewareArgs<BlockAction<StaticSelectAction>> & AllMiddlewareArgs) => {
    await ack();

    app.client.views.update({
        token: context.botToken,
        view_id: body.view ? body.view.id : '',
        view: modal({
            ...JSON.parse(body.view ? body.view.private_metadata : ''),
            [payload.action_id]: payload.selected_option.value,
        }),
    });
});

 app.view('post', async ({ ack, context, next, view }) => {
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
        next ? next() : null;
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

    const postAt = new Date(`${date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00+0900`).getTime()  / 1000;
    const displayDatetimeText = dayjs(`${values.date} ${values.hour}:${values.minute}:00`).format('YYYY年MM月DD日 HH:mm:ss')
    const messageOption: ChatScheduleMessageArguments = {
        token: context.botToken,
        channel: values.channel,
        unfurl_links: true,
        text: '',
        post_at: ''
    }

    for (const user of values.users) {
        let scheduledMessageId: unknown;

        try {
            messageOption.post_at = postAt.toString();
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
            continue
        }

        messageOption.channel = values.userId;
        messageOption.text = `${displayDatetimeText}に<@${user}>さんへ伝書をお届けします 🕊️`;
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
  await app.start(Number(process.env.PORT) || 3000);

  console.log('⚡️ Bolt app is running!');
})();
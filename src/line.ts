import axios from "axios";

export async function reply(replyToken: string, text: string) {
  await axios.post(
    "https://api.line.me/v2/bot/message/reply",
    {
      replyToken,
      messages: [
        {
          type: "text",
          text: text,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function replyWithMentions(
    replyToken: string,
    text: string,
    mentions: {
        key: string;
        userId: string;
    }[]
) {
    const substitution: Record<string, any> = {};

    for (const mention of mentions) {
        substitution[mention.key] = {
            type: "mention",
            mentionee: {
                type: "user",
                userId: mention.userId,
            },
        };
    }

    await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
            replyToken,
            messages: [
                {
                    type: "textV2",
                    text,
                    substitution,
                },
            ],
        },
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
            },
        }
    );
}

export async function replyWithMultipleMessages(
    replyToken: string,
    messages: {
        type: "textV2";
        text: string;
        substitution: Record<string, any>;
    }[]
) {
    await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
            replyToken,
            messages,
        },
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
            },
        }
    );
}
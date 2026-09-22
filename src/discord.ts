import {
    Client,
    GatewayIntentBits,
    TextChannel,
} from "discord.js";

import { getTodayTasks } from "./task";
import cron from "node-cron";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
});

function splitDiscordMessage(message: string, maxLength = 2000) {
    const chunks: string[] = [];
    let current = "";

    const lines = message.split("\n");

    for (const line of lines) {
        if ((current + line + "\n").length > maxLength) {
            if (current) {
                chunks.push(current);
            }

            current = line + "\n";
        } else {
            current += line + "\n";
        }
    }

    if (current) {
        chunks.push(current);
    }

    return chunks;
}

async function sendTodayTasks() {
    const channelId = process.env.DISCORD_CHANNEL_ID;

    if (!channelId) {
        throw new Error("DISCORD_CHANNEL_ID is not set");
    }

    const channel = await client.channels.fetch(channelId);

    if (!channel || !channel.isTextBased()) {
        throw new Error("Discord channel not found or is not a text channel");
    }

    if (!(channel instanceof TextChannel)) {
        throw new Error("Discord channel is not a TextChannel");
    }

    const todayTasks = await getTodayTasks();

    const incompleteTasks = todayTasks.filter((task) =>
        task.assignments.some(
            (assignment) => assignment.status !== "COMPLETED"
        )
    );

    if (incompleteTasks.length === 0) {
        await channel.send("🎉 ไม่มีงานที่ค้างอยู่ในวันนี้!");
        return;
    }

    let message = "📋 **Today's Tasks**\n\n";

    incompleteTasks.forEach((task, index) => {
        const pendingAssignments = task.assignments.filter(
            (assignment) => assignment.status !== "COMPLETED"
        );

        message += `**${index + 1}. ${task.title}**\n`;

        if (task.description) {
            message += `${task.description}\n`;
        }

        const mentions = pendingAssignments
        .map((assignment) => {
            const discordUserId = assignment.employee.discordUserId;

            if (discordUserId) {
                return `<@${discordUserId}>`;
            }

            return assignment.employee.name;
        })
        .join(", ");

    message += `👤 ${mentions}\n`;

        if (task.actionUrl) {
            message += `🔗 ${task.actionUrl}\n`;
        }

        message += "\n";
    });

    const chunks = splitDiscordMessage(message);

    for (const chunk of chunks) {
        await channel.send(chunk);
    }

    console.log("Today's tasks sent to Discord!");
}

export async function startDiscordBot() {
    const token = process.env.DISCORD_BOT_TOKEN;

    if (!token) {
        throw new Error("DISCORD_BOT_TOKEN is not set");
    }

    client.once("ready", (readyClient) => {
            console.log(
                `Discord bot logged in as ${readyClient.user.tag}`
            );
        });

            await client.login(token);
        }

cron.schedule(
    "0 9 * * *",
    async () => {
        try {
            await sendTodayTasks();
        } catch (error) {
            console.error(
                "Failed to send scheduled Discord tasks:",
                error
            );
        }
    },
    {
        timezone: "Asia/Bangkok",
    }
);
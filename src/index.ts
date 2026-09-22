import express from "express";
import dotenv from "dotenv";
import { reply, replyWithMentions, replyWithMultipleMessages } from "./line";
import { getTodayTasks } from "./task";
import prisma from "./db/prisma";
import cors from "cors";
import { startDiscordBot } from "./discord";

dotenv.config();

const app = express();


app.use(cors());


app.use(express.json());

app.get("/", (req, res) => {
    res.send("LINE Task PoC is running!");
});

app.get("/test", (req, res) => {
    res.send("TEST ROUTE WORKS");
});

app.get("/tasks", async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            include: {
                assignments: {
                    include: {
                        employee: true,
                    },
                },
            },
        });

        res.json(tasks);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to get tasks",
        });
    }
});

app.post("/tasks", async (req, res) => {
    try {
        const {
            title,
            description,
            actionUrl,
            employeeIds,
        } = req.body;

        const task = await prisma.task.create({
            data: {
                title,
                description,
                actionUrl,

                assignments: {
                    create: employeeIds.map((employeeId: number) => ({
                        employee: {
                            connect: {
                                id: employeeId,
                            },
                        },
                    })),
                },
            },

            include: {
                assignments: {
                    include: {
                        employee: true,
                    },
                },
            },
        });

        res.status(201).json(task);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to create task",
        });
    }
});

app.put("/tasks/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const {
            title,
            description,
            actionUrl,
            status,
            employeeIds,
        } = req.body;

        // Update the task itself
        await prisma.task.update({
            where: {
                id,
            },
            data: {
                title,
                description,
                actionUrl,
            },
        });

        // Replace existing assignments
        if (Array.isArray(employeeIds)) {
            await prisma.taskAssignment.deleteMany({
                where: {
                    taskId: id,
                },
            });

            await prisma.taskAssignment.createMany({
                data: employeeIds.map((employeeId: number) => ({
                    taskId: id,
                    employeeId,
                    status: status || "PENDING",
                })),
            });
        }

        // Return updated task with assignments
        const updatedTask = await prisma.task.findUnique({
            where: {
                id,
            },
            include: {
                assignments: {
                    include: {
                        employee: true,
                    },
                },
            },
        });

        res.json(updatedTask);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to update task",
        });
    }
});

app.delete("/tasks/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        // Delete all assignments belonging to this task first
        await prisma.taskAssignment.deleteMany({
            where: {
                taskId: id,
            },
        });

        // Then delete the task
        await prisma.task.delete({
            where: {
                id,
            },
        });

        res.json({
            message: "Task deleted successfully",
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to delete task",
        });
    }
});

app.get("/employees", async (req, res) => {
    try {
        const employees = await prisma.employee.findMany({
            include: {
    assignments: {
        include: {
            task: true,
        },
    },
}
        });

        res.json(employees);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to get employees",
        });
    }
});

app.get("/employees/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const employee = await prisma.employee.findUnique({
            where: {
                id,
            },
            include: {
    assignments: {
        include: {
            task: true,
        },
    },
}
        });

        if (!employee) {
            return res.status(404).json({
                error: "Employee not found",
            });
        }

        res.json(employee);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to get employee",
        });
    }
});

app.post("/employees", async (req, res) => {
    try {
        const { employeeNo, name, lineUserId, discordUserId } = req.body;

        const employee = await prisma.employee.create({
            data: {
                employeeNo,
                name,
                lineUserId,
                discordUserId,
            },
        });

        res.status(201).json(employee);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to create employee",
        });
    }
});

app.put("/employees/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const {
                employeeNo,
                name,
                lineUserId,
                discordUserId,
            } = req.body;

        const employee = await prisma.employee.update({
            where: {
                id,
            },
            data: {
                employeeNo,
                name,
                lineUserId,
                discordUserId,
            },
        });

        res.json(employee);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to update employee",
        });
    }
});

app.delete("/employees/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const employee = await prisma.employee.findUnique({
            where: {
                id,
            },
            include: {
    assignments: {
        include: {
            task: true,
        },
    },
}
        });

        if (!employee) {
            return res.status(404).json({
                error: "Employee not found",
            });
        }

        if (employee.assignments.length > 0) {
            return res.status(400).json({
                error: "Cannot delete employee with assigned tasks",
            });
        }

        await prisma.employee.delete({
            where: {
                id,
            },
        });

        res.json({
            message: "Employee deleted successfully",
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to delete employee",
        });
    }
});

app.post("/webhook", async (req, res) => {
    console.log("🔥 WEBHOOK HIT");
    console.log(JSON.stringify(req.body, null, 2));

    try {
        const events = req.body.events;

        for (const event of events) {

            if (
                event.type === "message" &&
                event.message.type === "text"
            ) {

                const text = event.message.text.trim();

                // =========================
                // HELLO
                // =========================
                if (text.toLowerCase() === "hello") {
                    await reply(
                        event.replyToken,
                        "👋 สวัสดีครับ!"
                    );
                    continue;
                }

                // =========================
                // REGISTER
                // Example:
                // /register Alice
                // =========================
                if (text.toLowerCase().startsWith("/register ")) {

                    const employeeName = text.substring("/register ".length).trim();

                    const employee = await prisma.employee.findFirst({
                        where: {
                            name: employeeName,
                        },
                    });

                    if (!employee) {
                        await reply(
                            event.replyToken,
                            `❌ ไม่พบพนักงานชื่อ ${employeeName}`
                        );
                        continue;
                    }

                    const lineUserId = event.source.userId;

                    if (!lineUserId) {
                        await reply(
                            event.replyToken,
                            "❌ ไม่สามารถระบุ LINE User ID ของคุณได้"
                        );
                        continue;
                    }

                    await prisma.employee.update({
                        where: {
                            id: employee.id,
                        },
                        data: {
                            lineUserId: lineUserId,
                        },
                    });

                    await reply(
                        event.replyToken,
                        `✅ ลงทะเบียนสำเร็จ\nชื่อ: ${employee.name}\n`
                    );

                    continue;
                }


                // =========================
                // DONE
                // Example:
                // /done 1
                // =========================
                if (text.toLowerCase().startsWith("/done ")) {
                    const taskNumberText = text.substring("/done ".length).trim();
                    const taskNumber = Number(taskNumberText);

                    // Check if the number is valid
                    if (!Number.isInteger(taskNumber) || taskNumber < 1) {
                        await reply(
                            event.replyToken,
                            "❌ กรุณาระบุหมายเลขงาน เช่น /done 1"
                        );
                        continue;
                    }

                    // Get the person who sent the command
                    const lineUserId = event.source.userId;

                    if (!lineUserId) {
                        await reply(
                            event.replyToken,
                            "❌ ไม่สามารถระบุ LINE User ID ของคุณได้"
                        );
                        continue;
                    }

                    // Find the employee who sent the command
                    const employee = await prisma.employee.findFirst({
                        where: {
                            lineUserId: lineUserId,
                        },
                    });

                    if (!employee) {
                        await reply(
                            event.replyToken,
                            "❌ คุณยังไม่ได้ลงทะเบียน กรุณาใช้ /register ชื่อของคุณก่อน"
                        );
                        continue;
                    }

                    // Get the same task list used by /today
                    const todayTasks = await getTodayTasks();

                    const incompleteTasks = todayTasks.filter((task) =>
                        task.assignments.some(
                            (assignment) => assignment.status !== "COMPLETED"
                        )
                    );

                    // Convert the number into an array index
                    const task = incompleteTasks[taskNumber - 1];

                    if (!task) {
                        await reply(
                            event.replyToken,
                            `❌ ไม่พบงานหมายเลข ${taskNumber}`
                        );
                        continue;
                    }

                    // Find this employee's assignment for this task
                    const assignment = task.assignments.find(
                        (assignment) => assignment.employeeId === employee.id
                    );

                    // Employee isn't assigned to this task
                    if (!assignment) {
                        await reply(
                            event.replyToken,
                            `❌ คุณไม่ได้รับมอบหมายงาน "${task.title}"`
                        );
                        continue;
                    }

                    // Already completed
                    if (assignment.status === "COMPLETED") {
                        await reply(
                            event.replyToken,
                            `ℹ️ คุณทำงาน "${task.title}" เสร็จไปแล้ว`
                        );
                        continue;
                    }

                    // Mark only this employee's assignment as completed
                    await prisma.taskAssignment.update({
                        where: {
                            id: assignment.id,
                        },
                        data: {
                            status: "COMPLETED",
                        },
                    });

                    // Check if anyone else is still pending
                    const remainingAssignments = task.assignments.filter(
                        (assignment) =>
                            assignment.employeeId !== employee.id &&
                            assignment.status !== "COMPLETED"
                    );

                    // Everyone is done
                    if (remainingAssignments.length === 0) {
                        await reply(
                            event.replyToken,
                            `🎉 งาน "${task.title}" เสร็จครบทุกคนแล้ว!`
                        );
                        continue;
                    }

                    // Someone is still pending
                    const remainingNames = remainingAssignments
                        .map((assignment) => assignment.employee.name)
                        .join(", ");

                    await reply(
                        event.replyToken,
                        `✅ ${employee.name} ทำงาน "${task.title}" เสร็จแล้ว\n\n` +
                        `⏳ ยังเหลือ: ${remainingNames}`
                    );

                    continue;
}

                // TODAY
                // =========================
                if (text.toLowerCase() === "/today") {
                    const todayTasks = await getTodayTasks();

                    // Only show tasks that still have someone pending
                    const incompleteTasks = todayTasks.filter((task) =>
                        task.assignments.some(
                            (assignment) => assignment.status !== "COMPLETED"
                        )
                    );

                    // Everything is completed
                    if (incompleteTasks.length === 0) {
                        await reply(
                            event.replyToken,
                            "🎉 วันนี้ไม่มีงานที่ค้างอยู่ ทุกคนทำงานครบแล้ว!"
                        );
                        continue;
                    }

                    // LINE allows multiple message objects in one reply.
                    // We split the report so it doesn't become too long.
                    const messages: {
                        type: "textV2";
                        text: string;
                        substitution: Record<string, any>;
                    }[] = [];

                    let currentText = "📋 งานที่ยังไม่เสร็จวันนี้\n\n";
                    let currentSubstitution: Record<string, any> = {};

                    let mentionCounter = 1;

                    // Keep some room below LINE's text limit.
                    const MAX_TEXT_LENGTH = 4500;

                    for (let index = 0; index < incompleteTasks.length; index++) {
                        const task = incompleteTasks[index];

                        const pendingAssignments = task.assignments.filter(
                            (assignment) => assignment.status !== "COMPLETED"
                        );

                        // Build this task as one complete block.
                        let taskText = `${index + 1}. ${task.title}\n`;
                        taskText += "⏳ ยังไม่เสร็จ: ";

                        const taskSubstitution: Record<string, any> = {};

                        pendingAssignments.forEach((assignment, i) => {
                            const employee = assignment.employee;
                            const lineUserId = employee.lineUserId;

                            // Check whether we have a real LINE user ID
                            const isValidLineUserId =
                                !!lineUserId &&
                                /^U[0-9a-f]{32}$/i.test(lineUserId);

                            if (isValidLineUserId) {
                                const key = `user${mentionCounter}`;

                                taskText += `{${key}}`;

                                taskSubstitution[key] = {
                                    type: "mention",
                                    mentionee: {
                                        type: "user",
                                        userId: lineUserId,
                                    },
                                };

                                mentionCounter++;
                            } else {
                                // No LINE ID → just show their name
                                taskText += employee.name;
                            }

                            if (i < pendingAssignments.length - 1) {
                                taskText += ", ";
                            }
                        });

                        taskText += "\n";

                        if (task.actionUrl) {
                            taskText += `🔗 ${task.actionUrl}\n`;
                        }

                        taskText += "\n";

                        // If adding this task would make the message too large,
                        // send the current message first.
                        if (
                            currentText.length + taskText.length > MAX_TEXT_LENGTH &&
                            currentText !== "📋 งานที่ยังไม่เสร็จวันนี้\n\n"
                        ) {
                            messages.push({
                                type: "textV2",
                                text: currentText.trim(),
                                substitution: currentSubstitution,
                            });

                            // Start a new message
                            currentText = "📋 งานที่ยังไม่เสร็จวันนี้ (ต่อ)\n\n";
                            currentSubstitution = {};
                        }

                        // Add the complete task to the current message
                        currentText += taskText;

                        Object.assign(
                            currentSubstitution,
                            taskSubstitution
                        );
                    }

                    // Add the final message
                    if (currentText.trim()) {
                        messages.push({
                            type: "textV2",
                            text: currentText.trim(),
                            substitution: currentSubstitution,
                        });
                    }

                    console.log(
                        `📨 /today generated ${messages.length} message(s)`
                    );

                    // LINE allows a maximum of 5 message objects per reply.
                    await replyWithMultipleMessages(
                        event.replyToken,
                        messages.slice(0, 5)
                    );

                    continue;
                }
            }
        }

        res.sendStatus(200);

    } catch (error) {
        console.error("❌ Webhook error:", error);

        res.sendStatus(500);
    }
});

app.listen(3000, "0.0.0.0", () => {
    console.log("🚀 Server running at http://localhost:3000");
});

startDiscordBot().catch((error) => {
    console.error("Failed to start Discord bot:", error);
});
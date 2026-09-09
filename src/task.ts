import prisma from "./db/prisma";

export async function getTodayTasks() {
    return prisma.task.findMany({
        include: {
            assignments: {
                include: {
                    employee: true,
                },
            },
        },
    });
}
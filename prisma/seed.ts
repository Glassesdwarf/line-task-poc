import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding database...");

    // Create employees
    const alice = await prisma.employee.create({
        data: {
            employeeNo: "EMP001",
            name: "Alice",
            lineUserId: "LINE_USER_ALICE",
        },
    });

    const bob = await prisma.employee.create({
        data: {
            employeeNo: "EMP002",
            name: "Bob",
            lineUserId: "LINE_USER_BOB",
        },
    });

    const charlie = await prisma.employee.create({
        data: {
            employeeNo: "EMP003",
            name: "Charlie",
            lineUserId: "LINE_USER_CHARLIE",
        },
    });

    // Create tasks
    const dailyReport = await prisma.task.create({
        data: {
            title: "Daily Report",
            description: "Submit today's daily report",
            actionUrl: "https://forms.google.com/daily-report",
        },
    });

    const monthlyReport = await prisma.task.create({
        data: {
            title: "Monthly Report",
            description: "Submit the monthly report",
            actionUrl: "https://forms.google.com/monthly-report",
        },
    });

    const vehicleInspection = await prisma.task.create({
        data: {
            title: "Vehicle Inspection",
            description: "Complete the vehicle inspection",
            actionUrl: "https://forms.google.com/vehicle",
        },
    });

    const safetyChecklist = await prisma.task.create({
        data: {
            title: "Safety Checklist",
            description: "Complete the safety checklist",
            actionUrl: "https://forms.google.com/safety",
        },
    });

    const inventoryCheck = await prisma.task.create({
        data: {
            title: "Inventory Check",
            description: "Check today's inventory",
            actionUrl: "https://forms.google.com/inventory",
        },
    });

    // Create task assignments
    await prisma.taskAssignment.createMany({
        data: [
            {
                taskId: dailyReport.id,
                employeeId: alice.id,
                status: "PENDING",
            },
            {
                taskId: monthlyReport.id,
                employeeId: alice.id,
                status: "PENDING",
            },
            {
                taskId: vehicleInspection.id,
                employeeId: bob.id,
                status: "PENDING",
            },
            {
                taskId: safetyChecklist.id,
                employeeId: charlie.id,
                status: "COMPLETED",
            },
            {
                taskId: inventoryCheck.id,
                employeeId: charlie.id,
                status: "PENDING",
            },
        ],
    });

    console.log("✅ Seed completed!");
}

main()
    .catch((error) => {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
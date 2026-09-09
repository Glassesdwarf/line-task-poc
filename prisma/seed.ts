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
    await prisma.task.createMany({
        data: [
            {
                title: "Daily Report",
                description: "Submit today's daily report",
                actionUrl: "https://forms.google.com/daily-report",
                status: "PENDING",
                employeeId: alice.id,
            },
            {
                title: "Monthly Report",
                description: "Submit the monthly report",
                actionUrl: "https://forms.google.com/monthly-report",
                status: "PENDING",
                employeeId: alice.id,
            },
            {
                title: "Vehicle Inspection",
                description: "Complete the vehicle inspection",
                actionUrl: "https://forms.google.com/vehicle",
                status: "PENDING",
                employeeId: bob.id,
            },
            {
                title: "Safety Checklist",
                description: "Complete the safety checklist",
                actionUrl: "https://forms.google.com/safety",
                status: "COMPLETED",
                employeeId: charlie.id,
            },
            {
                title: "Inventory Check",
                description: "Check today's inventory",
                actionUrl: "https://forms.google.com/inventory",
                status: "PENDING",
                employeeId: charlie.id,
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
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();

  const isTasks = pathname === "/";
  const isEmployees = pathname.startsWith("/employees");

  return (
    <nav className="border-b bg-white px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <h1 className="text-xl font-bold">
          LINE Task Admin
        </h1>

        <div className="flex gap-2">
          <Link
            href="/"
            className={`rounded-lg px-4 py-2 font-medium ${
              isTasks
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📋 Tasks
          </Link>

          <Link
            href="/employees"
            className={`rounded-lg px-4 py-2 font-medium ${
              isEmployees
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            👥 Employees
          </Link>
        </div>
      </div>
    </nav>
  );
}
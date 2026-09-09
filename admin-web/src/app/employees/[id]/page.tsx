"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Task = {
  id: number;
  title: string;
  description: string | null;
  actionUrl: string;
};

type TaskAssignment = {
  id: number;
  taskId: number;
  employeeId: number;
  status: "PENDING" | "COMPLETED";
  task: Task;
};

type Employee = {
  id: number;
  employeeNo: string;
  name: string;
  lineUserId: string | null;
  assignments: TaskAssignment[];
};

export default function EmployeeTasksPage() {
  const params = useParams();
  const id = params.id;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/employees/${id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch employee");
        }

        const data = await response.json();

        setEmployee(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-6xl text-center text-gray-500">
          Loading...
        </div>
      </main>
    );
  }

  if (!employee) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-6xl text-center text-gray-500">
          Employee not found.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {employee.name}'s Tasks
          </h1>

          <p className="mt-2 text-gray-600">
            {employee.employeeNo} •{" "}
            {employee.lineUserId || "No LINE User ID"}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow">

          {employee.assignments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No tasks found for this employee.
            </div>
          ) : (
            <table className="w-full">

              <thead className="bg-gray-50">
                <tr className="border-b text-left text-sm text-gray-600">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action URL</th>
                </tr>
              </thead>

              <tbody>
                  {employee.assignments.map((assignment) => (
                    <tr
                      key={assignment.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-6 py-4 text-gray-500">
                        {assignment.task.id}
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {assignment.task.title}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {assignment.task.description || "-"}
                      </td>

                      <td className="px-6 py-4">
                        {assignment.status}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {assignment.task.actionUrl || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>

            </table>
          )}

        </div>
      </div>
    </main>
  );
}
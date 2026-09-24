"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

type Employee = {
  id: number;
  employeeNo: string;
  name: string;
  lineUserId: string | null;
};

type TaskAssignment = {
  id: number;
  taskId: number;
  employeeId: number;
  status: "PENDING" | "COMPLETED";
  employee: Employee;
};

type Task = {
  id: number;
  title: string;
  description: string | null;
  actionUrl: string;
  status: "PENDING" | "COMPLETED";
  assignments: TaskAssignment[];
};

const getApiUrl = () => {
  return `http://${window.location.hostname}:3000`;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [newTask, setNewTask] = useState({
  title: "",
  description: "",
  actionUrl: "",
  employeeIds: [] as number[],
});

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/tasks`);

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
  try {
    const response = await fetch(`${getApiUrl()}/employees`);

    if (!response.ok) {
      throw new Error("Failed to fetch employees");
    }

    const data = await response.json();

    setEmployees(data);
  } catch (error) {
    console.error(error);
  }
};

  const addTask = async () => {
  try {
    const response = await fetch(
      `${getApiUrl()}/tasks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create task");
    }

    setNewTask({
      title: "",
      description: "",
      actionUrl: "",
      employeeIds: [],
    });

    setShowAddForm(false);

    await fetchTasks();
  } catch (error) {
    console.error(error);
  }
};

const updateTask = async () => {
    if (!editingTask) return;

    try {
      const response = await fetch(
        `${getApiUrl()}/tasks/${editingTask.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editingTask.title,
            description: editingTask.description,
            actionUrl: editingTask.actionUrl,
            status: editingTask.status,
            employeeIds: editingTask.assignments.map(
              (assignment) => assignment.employeeId
            ),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      setEditingTask(null);

      await fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

const deleteTask = async (id: number) => {
  try {
    const response = await fetch(
      `${getApiUrl()}/tasks/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }

    await fetchTasks();
  } catch (error) {
    console.error("Failed to delete task:", error);
  }
};

  useEffect(() => {
  fetchTasks();
  fetchEmployees();
}, []);

  return (
    <>
    <AdminNav />
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Task Management
            </h1>

            <p className="mt-2 text-gray-600">
              Manage tasks for the LINE Task system
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
          >
            + Add Task
          </button>
        </div>

                {showAddForm && (
          <div className="mb-6 rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Add New Task
            </h2>

            <div className="grid gap-4">
              <input
                type="text"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    title: e.target.value,
                  })
                }
                className="rounded-lg border px-4 py-2"
              />

              <textarea
                placeholder="Description"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    description: e.target.value,
                  })
                }
                className="rounded-lg border px-4 py-2"
              />

              <input
                type="text"
                placeholder="Action URL"
                value={newTask.actionUrl}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    actionUrl: e.target.value,
                  })
                }
                className="rounded-lg border px-4 py-2"
              />

              <div className="rounded-lg border p-4">
                  <p className="mb-3 font-medium text-gray-900">
                    Assign Employees
                  </p>

                  <div className="space-y-2">
                    {employees.map((employee) => {
                      const isAssigned = newTask.employeeIds.includes(employee.id);

                      return (
                        <label
                          key={employee.id}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTask({
                                  ...newTask,
                                  employeeIds: [
                                    ...newTask.employeeIds,
                                    employee.id,
                                  ],
                                });
                              } else {
                                setNewTask({
                                  ...newTask,
                                  employeeIds: newTask.employeeIds.filter(
                                    (id) => id !== employee.id
                                  ),
                                });
                              }
                            }}
                          />

                          <span>
                            {employee.name} ({employee.employeeNo})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

              <div className="flex gap-3">
                <button
                  onClick={addTask}
                  className="rounded-lg bg-black px-5 py-2 text-white hover:bg-gray-800"
                >
                  Create Task
                </button>

                <button
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg border px-5 py-2 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-xl bg-white shadow"></div>

        <div className="overflow-hidden rounded-xl bg-white shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No tasks found.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b text-left text-sm text-gray-600">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Task</th>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-gray-500">
                      {task.id}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {task.title}
                      </div>

                      {task.description && (
                        <div className="mt-1 text-sm text-gray-500">
                          {task.description}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {task.assignments.map((assignment) => (
                            <div key={assignment.id}>
                              {assignment.employee.name}
                            </div>
                          ))}
                        </div>

                        <div className="text-sm text-gray-500">
                          {task.assignments.map((assignment) => (
                            <div key={assignment.id}>
                              {assignment.employee.employeeNo}
                            </div>
                          ))}
                        </div>
                      </td>

                    <td className="px-6 py-4">
                          {(() => {
                            const isCompleted =
                              task.assignments.length > 0 &&
                              task.assignments.every(
                                (assignment) => assignment.status === "COMPLETED"
                              );

                            return (
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  isCompleted
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {isCompleted ? "COMPLETED" : "PENDING"}
                              </span>
                            );
                          })()}
                        </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                            onClick={() =>
                                setEditingTask({
                                  ...task,
                                  status: task.assignments.length > 0
                                    ? task.assignments[0].status
                                    : "PENDING",
                                })
                              }
                            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100"
                          >
                            Edit
                          </button>
                          <div className="overflow-hidden rounded-xl bg-white shadow">
                            {editingTask?.id === task.id && (
                                <div className="mb-6 rounded-xl bg-white p-6 shadow">
                                  <h2 className="mb-4 text-xl font-semibold text-gray-900">
                                    Edit Task
                                  </h2>

                                  <div className="grid gap-4">
                                    <input
                                      type="text"
                                      placeholder="Task title"
                                      value={editingTask.title}
                                      onChange={(e) =>
                                        setEditingTask({
                                          ...editingTask,
                                          title: e.target.value,
                                        })
                                      }
                                      className="rounded-lg border px-4 py-2"
                                    />

                                    <textarea
                                      placeholder="Description"
                                      value={editingTask.description ?? ""}
                                      onChange={(e) =>
                                        setEditingTask({
                                          ...editingTask,
                                          description: e.target.value,
                                        })
                                      }
                                      className="rounded-lg border px-4 py-2"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Action URL"
                                        value={editingTask.actionUrl}
                                        onChange={(e) =>
                                          setEditingTask({
                                            ...editingTask,
                                            actionUrl: e.target.value,
                                          })
                                        }
                                        className="rounded-lg border px-4 py-2"
                                      />

                                    <select
                                      value={editingTask.status}
                                      onChange={(e) =>
                                        setEditingTask({
                                          ...editingTask,
                                          status: e.target.value as "PENDING" | "COMPLETED",
                                        })
                                      }
                                      className="rounded-lg border px-4 py-2"
                                    >
                                      <option value="PENDING">PENDING</option>
                                      <option value="COMPLETED">COMPLETED</option>
                                    </select>

                                    <div className="rounded-lg border p-4">
                                          <p className="mb-3 font-medium text-gray-900">
                                            Assign Employees
                                          </p>

                                          <div className="space-y-2">
                                            {employees.map((employee) => {
                                              const isAssigned = editingTask.assignments.some(
                                                (assignment) => assignment.employeeId === employee.id
                                              );

                                              return (
                                                <label
                                                  key={employee.id}
                                                  className="flex items-center gap-2"
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={isAssigned}
                                                    onChange={(e) => {
                                                      if (e.target.checked) {
                                                        setEditingTask({
                                                          ...editingTask,
                                                          assignments: [
                                                            ...editingTask.assignments,
                                                            {
                                                              id: 0,
                                                              taskId: editingTask.id,
                                                              employeeId: employee.id,
                                                              status: "PENDING",
                                                              employee,
                                                            },
                                                          ],
                                                        });
                                                      } else {
                                                        setEditingTask({
                                                          ...editingTask,
                                                          assignments: editingTask.assignments.filter(
                                                            (assignment) =>
                                                              assignment.employeeId !== employee.id
                                                          ),
                                                        });
                                                      }
                                                    }}
                                                  />

                                                  <span>
                                                    {employee.name} ({employee.employeeNo})
                                                  </span>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        </div>
                                    <div className="flex gap-3">
                                      <button
                                        onClick={updateTask}
                                        className="rounded-lg bg-black px-5 py-2 text-white hover:bg-gray-800"
                                      >
                                        Save Changes
                                      </button>

                                      <button
                                        onClick={() => setEditingTask(null)}
                                        className="rounded-lg border px-5 py-2 hover:bg-gray-100"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                          </div>
                          
        <div className="overflow-hidden rounded-xl bg-white shadow"></div>
                        <button
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this task?")) {
                                deleteTask(task.id);
                              }
                            }}
                            className="rounded-lg border border-red-300 px-5 py-2 text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
    </>
  );
}

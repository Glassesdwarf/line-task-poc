"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";

type Employee = {
  id: number;
  employeeNo: string;
  name: string;
  lineUserId: string | null;
  discordUserId: string | null;
};

const getApiUrl = () => {
  return `http://${window.location.hostname}:3000`;
};

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [newEmployee, setNewEmployee] = useState({
    employeeNo: "",
    name: "",
    lineUserId: "",
    discordUserId: "",
  });

  const [editEmployee, setEditEmployee] = useState({
    employeeNo: "",
    name: "",
    lineUserId: "",
    discordUserId: "",
  });

  const fetchEmployees = async () => {
    try {
      const response = await fetch(
        `${getApiUrl()}/employees`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const data = await response.json();

      setEmployees(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // ADD EMPLOYEE
  // -----------------------------

  const addEmployee = async () => {
    try {
      const response = await fetch(
        `${getApiUrl()}/employees`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newEmployee),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create employee");
      }

      setNewEmployee({
        employeeNo: "",
        name: "",
        lineUserId: "",
        discordUserId: "",
      });

      setShowAddForm(false);

      await fetchEmployees();
    } catch (error) {
      console.error(error);
    }
  };

  // -----------------------------
  // START EDIT
  // -----------------------------

  const startEdit = (employee: Employee) => {
    setEditingEmployee(employee);

    setEditEmployee({
    employeeNo: employee.employeeNo,
    name: employee.name,
    lineUserId: employee.lineUserId || "",
    discordUserId: employee.discordUserId || "",
  });

    setShowAddForm(false);
  };

  // -----------------------------
  // UPDATE EMPLOYEE
  // -----------------------------

  const updateEmployee = async () => {
    if (!editingEmployee) return;

    try {
      const response = await fetch(
        `${getApiUrl()}/employees/${editingEmployee.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editEmployee),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update employee");
      }

      setEditingEmployee(null);

      setEditEmployee({
      employeeNo: "",
      name: "",
      lineUserId: "",
      discordUserId: "",
    });

      await fetchEmployees();
    } catch (error) {
      console.error(error);
    }
  };

  // -----------------------------
  // DELETE EMPLOYEE
  // -----------------------------

  const deleteEmployee = async (employee: Employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.name}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${getApiUrl()}/employees/${employee.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete employee");
        return;
      }

      await fetchEmployees();
    } catch (error) {
      console.error(error);
      alert("Failed to delete employee");
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <>
    <AdminNav />
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Employee Management
            </h1>

            <p className="mt-2 text-gray-600">
              Manage employees for the LINE Task system
            </p>
          </div>

          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingEmployee(null);
            }}
            className="rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
          >
            + Add Employee
          </button>
        </div>

        {/* Add Employee Form */}
        {showAddForm && (
          <div className="mb-6 rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Add New Employee
            </h2>

            <div className="grid gap-4">

              <input
                type="text"
                placeholder="Employee No. (e.g. EMP004)"
                value={newEmployee.employeeNo}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    employeeNo: e.target.value,
                  })
                }
                className="rounded-lg border px-4 py-2"
              />

              <input
                type="text"
                placeholder="Name"
                value={newEmployee.name}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    name: e.target.value,
                  })
                }
                className="rounded-lg border px-4 py-2"
              />

              <input
                type="text"
                placeholder="LINE User ID"
                value={newEmployee.lineUserId}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    lineUserId: e.target.value,
                  })
                }
                className="rounded-lg border px-4 py-2"
              />

              <input
                type="text"
                placeholder="Discord User ID"
                value={newEmployee.discordUserId}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    discordUserId: e.target.value,
                  })
                }
                className="rounded-lg border px-4 py-2"
              />

              <div className="flex gap-3">
                <button
                  onClick={addEmployee}
                  className="rounded-lg bg-black px-5 py-2 text-white hover:bg-gray-800"
                >
                  Create Employee
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

        {/* Edit Employee Form */}
        {editingEmployee && (
          <div className="mb-6 rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Edit Employee
            </h2>

            <div className="grid gap-4">

              <input
                type="text"
                placeholder="Discord User ID"
                value={editEmployee.discordUserId}
                onChange={(e) =>
                  setEditEmployee({
                    ...editEmployee,
                    discordUserId: e.target.value,
                  })
                }
                className="rounded-lg border px-4 py-2"
              />

              <input
                type="text"
                placeholder="Name"
                value={editEmployee.name}
                onChange={(e) =>
                  setEditEmployee({
                    ...editEmployee,
                    name: e.target.value,
                  })
                }
                className="rounded-lg border px-4 py-2"
              />

              <input
                type="text"
                placeholder="LINE User ID"
                value={editEmployee.lineUserId}
                onChange={(e) =>
                  setEditEmployee({
                    ...editEmployee,
                    lineUserId: e.target.value,
                  })
                }
                className="rounded-lg border px-4 py-2"
              />

              <div className="flex gap-3">
                <button
                  onClick={updateEmployee}
                  className="rounded-lg bg-black px-5 py-2 text-white hover:bg-gray-800"
                >
                  Save Changes
                </button>

                <button
                  onClick={() => setEditingEmployee(null)}
                  className="rounded-lg border px-5 py-2 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Employee Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow">

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading employees...
            </div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No employees found.
            </div>
          ) : (
            <table className="w-full">

              <thead className="bg-gray-50">
                <tr className="border-b text-left text-sm text-gray-600">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Employee No.</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">LINE User ID</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-gray-500">
                      {employee.id}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-900">
                      {employee.employeeNo}
                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      {employee.name}
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {employee.lineUserId || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">

                        <button
                            onClick={() => router.push(`/employees/${employee.id}`)}
                            className="rounded-lg border px-5 py-2 hover:bg-gray-100"
                          >
                            View Tasks               
                            
                          </button>

                        <button
                          onClick={() => startEdit(employee)}
                          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteEmployee(employee)}
                          className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
"use client";
import { useState } from "react";

export default function Dashboard() {
  const [students, setStudents] = useState([
    { id: 1, name: "Rahul Kumar", status: "" },
    { id: 2, name: "Priya Singh", status: "" },
  ]);

  const [newName, setNewName] = useState(""); 

  
  const addStudent = () => {
    if (newName.trim() === "") return; 
    const newStudent = {
      id: students.length + 1,
      name: newName,
      status: "",
    };
    setStudents([...students, newStudent]);
    setNewName(""); 
  };

  const markAttendance = (id: number, status: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, status } : s));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Attendance Sheet - Class 10A</h1>
        
        
        <div className="flex gap-4 mb-8 bg-blue-50 p-4 rounded-lg">
          <input 
            type="text" 
            placeholder="Student ka naam likhein..." 
            className="flex-1 p-2 border rounded border-blue-200 outline-none focus:border-blue-500"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button 
            onClick={addStudent}
            className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700"
          >
            + Add Student
          </button>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="p-3 text-left rounded-tl-lg">Roll No.</th>
              <th className="p-3 text-left">Student Name</th>
              <th className="p-3 text-center rounded-tr-lg">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3">{student.id}</td>
                <td className="p-3 font-medium text-slate-700">{student.name}</td>
                <td className="p-3 text-center space-x-2">
                  <button 
                    onClick={() => markAttendance(student.id, "Present")}
                    className={`px-4 py-1 rounded-md text-sm font-bold ${student.status === "Present" ? "bg-green-600 text-white" : "bg-green-100 text-green-700"}`}
                  >
                    P
                  </button>
                  <button 
                    onClick={() => markAttendance(student.id, "Absent")}
                    className={`px-4 py-1 rounded-md text-sm font-bold ${student.status === "Absent" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`}
                  >
                    A
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
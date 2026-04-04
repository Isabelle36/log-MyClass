"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, GraduationCap } from 'lucide-react';

const attendanceData = [
  { date: 'Jan', present: 85, absent: 15 },
  { date: 'Feb', present: 88, absent: 12 },
  { date: 'Mar', present: 92, absent: 8 },
  { date: 'Apr', present: 90, absent: 10 },
  { date: 'May', present: 95, absent: 5 },
];

const deptData = [
  { name: 'BBA', students: 245, fill: '#8b5cf6' },
  { name: 'BCA', students: 180, fill: '#06b6d4' },
];

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'];

export function AttendanceTrendChart() {
  return (
    <div
      className="glass-card h-64 backdrop-blur-xl border border-white/50 shadow-2xl"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(233, 213, 255, 0.9), rgba(219, 234, 254, 0.9), rgba(224, 231, 255, 0.9))" }}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/20 rounded-2xl border border-purple-200">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">Attendance Trend</p>
            <p
              className="text-2xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #7c3aed, #4f46e5, #2563eb)" }}
            >
              92.5%
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickCount={4} />
            <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
            <Line type="monotone" dataKey="present" stroke="#8b5cf6" strokeWidth={4} dot={{ fill: '#8b5cf6', strokeWidth: 2 }} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444' }} />
            <Area type="monotone" dataKey="present" stackId="1" stroke="#8b5cf6" fill="#c7d2fe" fillOpacity={0.6} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DepartmentPieChart({ totalStudents = 425 }) {
  return (
    <div
      className="glass-card h-64 backdrop-blur-xl border border-white/50 shadow-2xl"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(204, 251, 241, 0.9), rgba(207, 250, 254, 0.9), rgba(219, 234, 254, 0.9))" }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">Department Breakdown</p>
            <p
              className="text-2xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #059669, #06b6d4, #2563eb)" }}
            >
              {totalStudents.toLocaleString()}
            </p>
          </div>
          <Users className="h-12 w-12 text-teal-500/70" />
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={deptData} cx="50%" cy="50%" outerRadius={80} dataKey="students" label>
              {deptData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={3} stroke="rgba(255,255,255,0.8)" />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


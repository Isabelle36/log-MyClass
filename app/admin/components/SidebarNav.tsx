"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LayoutDashboard, Users, GraduationCap, BarChart3, Settings, Activity } from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin", active: true },
  { icon: Users, label: "Teachers", href: "/admin/teachers", active: false },
  { icon: GraduationCap, label: "Students", href: "/admin/students", active: false },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics", active: false },
  { icon: Activity, label: "Attendance", href: "/admin/attendance", active: false },
  { icon: Settings, label: "Settings", href: "/admin/settings", active: false },
];

export function SidebarNav({ isOpen }: { isOpen: boolean }) {
  return (
    <motion.aside
      animate={{ width: isOpen ? 280 : 72 }}
      className="glass-card h-full bg-linear-to-b from-white/90 via-blue-50/90 to-indigo-100/90 backdrop-blur-xl border-r border-white/60 shadow-2xl"
    >
      <div className="p-6 border-b border-white/50">
        <h2 className="text-xl font-bold bg-linear-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Admin Hub
        </h2>
      </div>
      <nav className="p-4 space-y-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className={`glass-nav-item flex items-center gap-4 p-4 rounded-2xl border border-white/40 hover:border-purple-200 hover:bg-purple-500/10 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group ${
                  item.active ? "bg-linear-to-r from-purple-500/20 border-purple-300 shadow-purple-200/50" : ""
                }`}
              >
                <div className="p-2 rounded-2xl bg-white/50 backdrop-blur-sm border group-hover:bg-purple-400/30 transition-colors">
                  <Icon className={`h-5 w-5 ${item.active ? "text-purple-600" : "text-slate-600"}`} />
                </div>
                <span className={`font-semibold transition-all ${item.active ? "text-purple-700" : "text-slate-700 group-hover:text-purple-600"}`}>
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </motion.aside>
  );
}



"use client"

import { Button } from "@/components/ui/button";
import { Plus, Download, Users, GraduationCap, Settings, Zap } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  { icon: Plus, label: "Invite Teacher", color: "from-purple-500 to-indigo-600", href: "#" },
  { icon: Download, label: "Export CSV", color: "from-emerald-500 to-teal-600", href: "#" },
  { icon: Users, label: "Bulk Promote", color: "from-orange-500 to-amber-600", href: "#" },
  { icon: GraduationCap, label: "Attendance Audit", color: "from-blue-500 to-cyan-600", href: "#" },
  { icon: Settings, label: "System Settings", color: "from-rose-500 to-pink-600", href: "#" },
  { icon: Zap, label: "Quick Reports", color: "from-lime-500 to-green-600", href: "#" },
];

export function QuickActions() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6"
    >
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
<motion.div
            key={action.label}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -4 }}
            className="glass-card group cursor-pointer"
          >
            <Button
              variant="ghost"
              size="lg"
              className="h-full w-full flex flex-col gap-2 p-4 text-left justify-start bg-linear-to-br! hover:brightness-110 transition-all duration-300 group-hover:shadow-2xl"
              style={{ backgroundImage: `linear-gradient(${action.color})` }}
            >
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/50 shadow-lg group-hover:rotate-12 transition-transform duration-300">
                <Icon className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
              <span className="font-semibold text-white text-sm drop-shadow-md">{action.label}</span>
            </Button>
          </motion.div>
        );
      })}
    </motion.div>
  );
}


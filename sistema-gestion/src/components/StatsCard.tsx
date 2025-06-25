"use client";

import { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: "blue" | "red" | "green" | "purple" | "indigo" | "emerald";
  isCurrency?: boolean;
}

const colorClasses = {
  blue: "bg-blue-500 text-blue-100",
  red: "bg-red-500 text-red-100",
  green: "bg-green-500 text-green-100",
  purple: "bg-purple-500 text-purple-100",
  indigo: "bg-indigo-500 text-indigo-100",
  emerald: "bg-emerald-500 text-emerald-100",
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  isCurrency = false,
}: StatsCardProps) {
  const displayValue = isCurrency
    ? formatCurrency(value)
    : value.toLocaleString("es-AR");
  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center">
        <div className={`p-2 md:p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4 md:h-6 md:w-6" />
        </div>
        <div className="ml-2 md:ml-4 min-w-0 flex-1">
          <p className="text-xs md:text-sm font-medium text-gray-600 truncate">
            {title}
          </p>
          <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">
            {displayValue}
          </p>
        </div>
      </div>
    </div>
  );
}

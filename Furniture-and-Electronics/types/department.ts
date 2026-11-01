export type Department = "FURNITURE" | "ELECTRONICS" | "ALL";

export interface DepartmentConfig {
  id: Department;
  label: string;
  shortLabel: string;
  icon: string;
  activeColor: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export const DEPARTMENTS: Record<Department, DepartmentConfig> = {
  FURNITURE: {
    id: "FURNITURE",
    label: "Furniture Division",
    shortLabel: "Furniture",
    icon: "🪑",
    activeColor: "bg-amber-600 text-white shadow-amber-200",
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-700",
    description: "Beds, Sofas, Dining Tables, Wardrobes, Dressing Tables",
  },
  ELECTRONICS: {
    id: "ELECTRONICS",
    label: "Electronics Division",
    shortLabel: "Electronics",
    icon: "⚡",
    activeColor: "bg-blue-600 text-white shadow-blue-200",
    badgeBg: "bg-blue-50 border-blue-200",
    badgeText: "text-blue-700",
    description: "Televisions, Refrigerators, Air Conditioners, Washing Machines",
  },
  ALL: {
    id: "ALL",
    label: "All Store (Combined)",
    shortLabel: "All Store",
    icon: "🌐",
    activeColor: "bg-slate-800 text-white shadow-slate-200",
    badgeBg: "bg-slate-50 border-slate-200",
    badgeText: "text-slate-700",
    description: "Consolidated showroom overview across both divisions",
  },
};

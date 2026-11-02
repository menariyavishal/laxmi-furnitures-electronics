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
    activeColor: "bg-[#8EB69B] text-white shadow-[0_2.5px_0_#5B7E67,0_4px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.45)] border border-[#7BA289] border-b-[#5B7E67]",
    badgeBg: "bg-[#8EB69B] border border-[#7BA289] border-b-[#5B7E67] shadow-[0_1.5px_0_#5B7E67,inset_0_1px_0_rgba(255,255,255,0.45)]",
    badgeText: "text-white font-bold",
    description: "Beds, Sofas, Dining Tables, Wardrobes, Dressing Tables",
  },
  ELECTRONICS: {
    id: "ELECTRONICS",
    label: "Electronics Division",
    shortLabel: "Electronics",
    icon: "⚡",
    activeColor: "bg-[#216A85] text-white shadow-[0_2.5px_0_#144E63,0_4px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.45)] border border-[#2D7F9E] border-b-[#144E63]",
    badgeBg: "bg-[#216A85] border border-[#2D7F9E] border-b-[#144E63] shadow-[0_1.5px_0_#144E63,inset_0_1px_0_rgba(255,255,255,0.45)]",
    badgeText: "text-white font-bold",
    description: "Televisions, Refrigerators, Air Conditioners, Washing Machines",
  },
  ALL: {
    id: "ALL",
    label: "All Store (Combined)",
    shortLabel: "All Store",
    icon: "🌐",
    activeColor: "bg-[#CCD0CF] text-[#0B1421] shadow-slate-200",
    badgeBg: "bg-[#CCD0CF] border border-[#B8C0C2] border-b-[#9BA5A8] shadow-[0_1.5px_0_#9BA5A8,inset_0_1px_0_rgba(255,255,255,0.7)]",
    badgeText: "text-[#0B1421] font-bold",
    description: "Consolidated showroom overview across both divisions",
  },
};

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Department, DEPARTMENTS } from "@/types/department";

interface DepartmentContextType {
  department: Department;
  setDepartment: (dept: Department) => void;
  isFurniture: boolean;
  isElectronics: boolean;
  isAll: boolean;
  config: typeof DEPARTMENTS[Department];
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

const STORAGE_KEY = "laxmi_active_department";

export function DepartmentProvider({ children }: { children: React.ReactNode }) {
  const [department, setDepartmentState] = useState<Department>("FURNITURE");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Department | null;
      if (saved && (saved === "FURNITURE" || saved === "ELECTRONICS" || saved === "ALL")) {
        setDepartmentState(saved);
      }
    } catch {
      // Fallback silently if localStorage not available
    }
    setMounted(true);
  }, []);

  const setDepartment = (dept: Department) => {
    setDepartmentState(dept);
    try {
      localStorage.setItem(STORAGE_KEY, dept);
    } catch {
      // Ignore storage errors
    }
  };

  const value: DepartmentContextType = {
    department,
    setDepartment,
    isFurniture: department === "FURNITURE",
    isElectronics: department === "ELECTRONICS",
    isAll: department === "ALL",
    config: DEPARTMENTS[department],
  };

  return (
    <DepartmentContext.Provider value={value}>
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartment() {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error("useDepartment must be used within a DepartmentProvider");
  }
  return context;
}

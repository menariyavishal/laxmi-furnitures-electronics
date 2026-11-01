import type { Metadata } from "next";
import "./frontend.css";

export const metadata: Metadata = {
  title: "Laxmi Electronics & Furnitures",
  description: "Welcome to Laxmi Electronics & Furnitures - Premium Electronics & Home Furnishings",
};

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="frontend-wrapper min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {children}
    </div>
  );
}

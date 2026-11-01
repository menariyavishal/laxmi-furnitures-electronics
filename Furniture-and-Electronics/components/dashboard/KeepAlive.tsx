"use client";

import { useEffect } from "react";

export default function KeepAlive() {
  useEffect(() => {
    // Ping every 4 minutes (240,000 ms) to keep Neon Serverless PostgreSQL warm and prevent cold starts
    const interval = setInterval(() => {
      fetch("/api/v1/health").catch((err) => {
        console.error("Keep-alive ping failed:", err);
      });
    }, 240000);

    return () => clearInterval(interval);
  }, []);

  return null;
}

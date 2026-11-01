import React from "react";
import { Skeleton } from "@/components/dashboard/Skeleton";

export default function PurchasesLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Title & Subtitle Skeleton */}
      <div>
        <Skeleton className="h-8 w-64 mb-2 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      {/* 3 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between"
          >
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-7 w-36 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
            <Skeleton className="w-10 h-10 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Search & Filters Skeleton */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-full sm:w-48 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-36 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4"><Skeleton className="h-3 w-24 rounded" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3 w-28 rounded" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3 w-12 rounded" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3 w-32 rounded" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3 w-16 ml-auto rounded" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3 w-16 ml-auto rounded" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3 w-16 ml-auto rounded" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3 w-14 mx-auto rounded" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3 w-16 ml-auto rounded" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="py-3.5 px-4 space-y-1.5">
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <Skeleton className="h-2.5 w-16 rounded" />
                  </td>
                  <td className="py-3.5 px-4 space-y-1.5">
                    <Skeleton className="h-3.5 w-32 rounded" />
                    <Skeleton className="h-2.5 w-20 rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <Skeleton className="h-5 w-14 rounded" />
                  </td>
                  <td className="py-3.5 px-4 space-y-1.5">
                    <Skeleton className="h-3.5 w-40 rounded" />
                    <Skeleton className="h-2.5 w-24 rounded" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Skeleton className="h-4 w-16 ml-auto rounded" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Skeleton className="h-4 w-16 ml-auto rounded" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Skeleton className="h-4 w-14 ml-auto rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-7 w-16 rounded" />
                      <Skeleton className="h-7 w-7 rounded" />
                      <Skeleton className="h-7 w-7 rounded" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


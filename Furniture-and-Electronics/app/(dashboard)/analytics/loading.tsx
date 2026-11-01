import { Skeleton } from "@/components/dashboard/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded border border-gray-200" />
          <Skeleton className="h-10 w-28 rounded bg-blue-600" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-blue-500 border border-gray-100">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-8 w-40" />
        </div>
        {/* Total Profit Margin */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-green-500 border border-gray-100">
          <Skeleton className="h-3 w-32 mb-3" />
          <Skeleton className="h-8 w-40" />
        </div>
        {/* Bills Generated */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-purple-500 border border-gray-100">
          <Skeleton className="h-3 w-28 mb-3" />
          <Skeleton className="h-8 w-16" />
        </div>
        {/* Low Stock Warnings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-red-500 border border-gray-100">
          <Skeleton className="h-3 w-32 mb-3" />
          <Skeleton className="h-8 w-16 text-red-500" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <Skeleton className="h-5 w-48 mb-6" />
          <Skeleton className="flex-1 w-full rounded" />
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-full">
            <Skeleton className="h-5 w-48 mb-10" />
          </div>
          <Skeleton className="w-48 h-48 rounded-full border-[16px] border-blue-500 bg-transparent mb-10" />
          <Skeleton className="h-4 w-40 mb-10" />
          <Skeleton className="h-3 w-56 mt-auto" />
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/dashboard/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 pb-12">
      {/* 1. Welcome & Quick Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* 2. WhatsApp Integration Status Banner */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
          <div>
            <Skeleton className="h-6 w-56 mb-2" />
            <Skeleton className="h-4 w-96 max-w-xl mb-1" />
            <Skeleton className="h-4 w-80 max-w-xl" />
          </div>
        </div>
        <div className="shrink-0">
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
      </div>

      {/* 3. KPI Cards Grid (6 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-3 w-28 mb-3" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-40 mt-6" />
          </div>
        ))}
      </div>

      {/* 4. Sales Analytics & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Analytics Trend (takes 2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          </div>
          <div className="flex-1 mt-4">
            <Skeleton className="w-full h-[300px] rounded" />
          </div>
        </div>

        {/* Inventory Alerts (takes 1 col) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-4 flex-1">
            <Skeleton className="w-full h-20 rounded-lg" />
            <Skeleton className="w-full h-20 rounded-lg" />
            <Skeleton className="w-full h-20 rounded-lg" />
          </div>
          <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-100">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>

      {/* 5. Stock Distribution & Fast/Slow Moving Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock by Category */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-3 w-56 mb-8" />
          <div className="flex-1">
            <Skeleton className="w-full h-[250px] rounded" />
          </div>
        </div>

        {/* Fast-Moving Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-3 w-40 mb-6" />
          <div className="flex-1 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* Slow-Moving Items */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-3 w-40 mb-6" />
          <div className="flex-1 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Quick Management Utilities */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <Skeleton className="h-6 w-56 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

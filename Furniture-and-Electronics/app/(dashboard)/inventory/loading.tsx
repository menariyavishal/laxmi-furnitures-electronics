import { Skeleton } from "@/components/dashboard/Skeleton";

export default function InventoryLoading() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36 rounded bg-green-500" />
          <Skeleton className="h-10 w-32 rounded bg-blue-600" />
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-10 flex-1 rounded border border-gray-200" />
        <Skeleton className="h-10 w-64 rounded border border-gray-200" />
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left"><Skeleton className="h-3 w-16" /></th>
              <th className="px-6 py-3 text-left"><Skeleton className="h-3 w-20" /></th>
              <th className="px-6 py-3 text-left"><Skeleton className="h-3 w-20" /></th>
              <th className="px-6 py-3 text-left"><Skeleton className="h-3 w-24" /></th>
              <th className="px-6 py-3 text-center"><Skeleton className="h-3 w-12 mx-auto" /></th>
              <th className="px-6 py-3 text-right"><Skeleton className="h-3 w-16 ml-auto" /></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td className="px-6 py-4 flex gap-4 items-center">
                  <Skeleton className="w-12 h-12 rounded border border-gray-200" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24 mb-2" />
                    <Skeleton className="h-5 w-40 rounded" />
                  </div>
                </td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-20 font-bold" /></td>
                <td className="px-6 py-4 text-center">
                  <Skeleton className="h-6 w-8 rounded-full mx-auto bg-green-100" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-3 text-sm font-bold">
                    <Skeleton className="h-4 w-12 text-blue-600" />
                    <Skeleton className="h-4 w-8 text-yellow-600" />
                    <Skeleton className="h-4 w-12 text-red-600" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

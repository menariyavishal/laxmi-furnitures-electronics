import { Skeleton } from "@/components/dashboard/Skeleton";

export default function BillingHistoryLoading() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36 rounded-md bg-blue-100" />
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Skeleton className="h-10 w-full rounded border border-gray-100" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left"><Skeleton className="h-3 w-10" /></th>
              <th className="px-6 py-3 text-left"><Skeleton className="h-3 w-20" /></th>
              <th className="px-6 py-3 text-left"><Skeleton className="h-3 w-20" /></th>
              <th className="px-6 py-3 text-left"><Skeleton className="h-3 w-24" /></th>
              <th className="px-6 py-3 text-left"><Skeleton className="h-3 w-16" /></th>
              <th className="px-6 py-3 text-center"><Skeleton className="h-3 w-14 mx-auto" /></th>
              <th className="px-6 py-3 text-center"><Skeleton className="h-3 w-16 mx-auto" /></th>
              <th className="px-6 py-3 text-right"><Skeleton className="h-3 w-16 ml-auto" /></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                <td className="px-6 py-4"><Skeleton className="h-5 w-12 font-bold" /></td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-16 font-bold" /></td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                <td className="px-6 py-4 text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto bg-green-100" /></td>
                <td className="px-6 py-4 text-center"><Skeleton className="h-6 w-16 rounded-full mx-auto bg-red-100" /></td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
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

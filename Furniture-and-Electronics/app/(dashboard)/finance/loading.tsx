import { Skeleton } from "@/components/dashboard/Skeleton";

export default function FinanceLoading() {
  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg bg-white border border-gray-200" />
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <Skeleton className="h-10 w-full max-w-md rounded-lg border border-gray-200" />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left"><Skeleton className="h-3 w-12" /></th>
                <th className="px-6 py-3 text-left"><Skeleton className="h-3 w-16" /></th>
                <th className="px-6 py-3 text-left"><Skeleton className="h-3 w-32" /></th>
                <th className="px-6 py-3 text-left"><Skeleton className="h-3 w-32" /></th>
                <th className="px-6 py-3 text-center"><Skeleton className="h-3 w-24 mx-auto" /></th>
                <th className="px-6 py-3 text-center"><Skeleton className="h-3 w-16 mx-auto" /></th>
                <th className="px-6 py-3 text-right"><Skeleton className="h-3 w-20 ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-12 text-blue-600 font-bold" /></td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-32 mb-1 font-bold" />
                    <Skeleton className="h-3 w-24" />
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full bg-blue-50" /></td>
                  <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-20 mx-auto font-bold" /></td>
                  <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-8 mx-auto font-bold" /></td>
                  <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-20 ml-auto font-bold" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/dashboard/Skeleton";

export default function DuePaymentsLoading() {
  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64 rounded bg-white border border-gray-200" />
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left"><Skeleton className="h-3 w-16" /></th>
              <th className="px-6 py-4 text-left"><Skeleton className="h-3 w-12" /></th>
              <th className="px-6 py-4 text-left"><Skeleton className="h-3 w-20" /></th>
              <th className="px-6 py-4 text-left"><Skeleton className="h-3 w-16" /></th>
              <th className="px-6 py-4 text-left"><Skeleton className="h-3 w-12" /></th>
              <th className="px-6 py-4 text-left"><Skeleton className="h-3 w-10 text-red-500" /></th>
              <th className="px-6 py-4 text-center"><Skeleton className="h-3 w-14 mx-auto" /></th>
              <th className="px-6 py-4 text-center"><Skeleton className="h-3 w-16 mx-auto" /></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td className="px-6 py-5"><Skeleton className="h-4 w-12 text-blue-600" /></td>
                <td className="px-6 py-5">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </td>
                <td className="px-6 py-5">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </td>
                <td className="px-6 py-5"><Skeleton className="h-4 w-20 font-bold" /></td>
                <td className="px-6 py-5"><Skeleton className="h-4 w-20 font-bold text-green-600" /></td>
                <td className="px-6 py-5 bg-red-50/30"><Skeleton className="h-4 w-20 font-bold text-red-600" /></td>
                <td className="px-6 py-5 text-center"><Skeleton className="h-6 w-6 rounded mx-auto bg-gray-300" /></td>
                <td className="px-6 py-5 text-center"><Skeleton className="h-8 w-8 rounded-full mx-auto bg-gray-200" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

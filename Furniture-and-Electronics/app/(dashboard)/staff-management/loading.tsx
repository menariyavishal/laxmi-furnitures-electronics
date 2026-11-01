import { Skeleton } from "@/components/dashboard/Skeleton";

export default function StaffManagementLoading() {
  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white p-6 rounded-lg shadow-sm flex justify-between items-center border border-gray-100">
        <div>
          <Skeleton className="h-8 w-64 mb-1" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded bg-blue-600" />
      </div>

      {/* Grid of Users */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Skeleton className="h-6 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full bg-blue-100" />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-2 w-2 rounded-full bg-green-500" />
                <Skeleton className="h-3 w-12" />
              </div>

              <Skeleton className="h-3 w-24 mb-4" />
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
              <Skeleton className="h-4 w-16 text-red-500" />
              <Skeleton className="h-4 w-20 text-blue-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

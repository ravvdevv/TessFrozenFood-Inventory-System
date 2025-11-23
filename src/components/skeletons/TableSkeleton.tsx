import { Skeleton } from "@/components/ui/skeleton"

type TableSkeletonProps = {
  rows?: number
  columns?: number
}

export const TableSkeleton = ({ rows = 5, columns = 5 }: TableSkeletonProps) => {
  return (
    <div className="w-full space-y-2">
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-10 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`row-${rowIndex}-col-${colIndex}`} 
              className="h-12 flex-1" 
            />
          ))}
        </div>
      ))}
    </div>
  )
}

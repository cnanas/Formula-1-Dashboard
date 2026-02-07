import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-1/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-1/2 mb-2" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
    </Card>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: `${Math.random() * 60 + 40}px` }}
        />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

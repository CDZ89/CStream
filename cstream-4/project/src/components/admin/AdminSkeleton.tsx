import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const StatsCardSkeleton = memo(() => (
  <Card className="border-l-4 border-l-muted">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="w-12 h-12 rounded-full" />
      </div>
    </CardContent>
  </Card>
));

export const TableRowSkeleton = memo(() => (
  <div className="flex items-center gap-4 p-4 border-b border-border/50 animate-pulse">
    <Skeleton className="w-10 h-10 rounded" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-3 w-32" />
    </div>
    <Skeleton className="h-6 w-16 rounded-full" />
    <Skeleton className="h-6 w-12 rounded-full" />
    <div className="flex gap-2">
      <Skeleton className="w-8 h-8 rounded" />
      <Skeleton className="w-8 h-8 rounded" />
    </div>
  </div>
));

export const ReadersTabSkeleton = memo(() => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-0 border rounded-lg overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
));

export const UsersTabSkeleton = memo(() => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
));

export const MessagesTabSkeleton = memo(() => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
));

export const SettingsTabSkeleton = memo(() => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  </div>
));

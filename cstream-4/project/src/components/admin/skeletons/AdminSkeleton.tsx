import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const StatsCardSkeleton = () => (
  <Card className="border-l-4 border-l-primary/30">
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
);

export const TableRowSkeleton = ({ columns = 8 }: { columns?: number }) => (
  <div className="flex items-center gap-4 p-4 border-b border-border/50">
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-8' : i === 1 ? 'w-40' : 'w-20'}`} />
    ))}
  </div>
);

export const ReadersTabSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    </CardContent>
  </Card>
);

export const UsersTabSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border/50">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const MessagesTabSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const SettingsTabSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-24 h-24 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const AdminTabSkeleton = ({ kind }: { kind: 'readers' | 'users' | 'messages' | 'settings' | 'notifications' }) => {
  switch (kind) {
    case 'readers':
      return <ReadersTabSkeleton />;
    case 'users':
      return <UsersTabSkeleton />;
    case 'messages':
      return <MessagesTabSkeleton />;
    case 'settings':
      return <SettingsTabSkeleton />;
    case 'notifications':
      return <SettingsTabSkeleton />;
    default:
      return <ReadersTabSkeleton />;
  }
};

export const AdminPageSkeleton = () => (
  <div className="container mx-auto px-4 py-6 space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
    
    <div className="space-y-4">
      <Skeleton className="h-12 w-full max-w-4xl" />
      <ReadersTabSkeleton />
    </div>
  </div>
);

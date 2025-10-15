import { Skeleton } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function DashboardLoading() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex flex-col space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SidebarMenuItem key={i}>
                      <div className="flex h-8 items-center gap-2 rounded-md px-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex h-8 items-center gap-2 rounded-md px-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-6 w-32" />
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-6">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>

            <div className="rounded-lg border bg-card p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="text-right space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

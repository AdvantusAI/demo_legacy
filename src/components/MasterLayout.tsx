import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";

interface MasterLayoutProps {
  children: React.ReactNode;
}
export function MasterLayout({
  children
}: MasterLayoutProps) {
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/20">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto bg-stone-100">
            <div className="w-full px-6 py-4 max-w-none bg-[#fdfdfd]/[0.61]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>;
}
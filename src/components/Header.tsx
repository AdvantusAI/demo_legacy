
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4 bg-white ml-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold text-gray-900">M8 Platform</h1>
      </div>
      <div className="flex items-center gap-4">
        <UserMenu />
      </div>
    </header>
  );
}

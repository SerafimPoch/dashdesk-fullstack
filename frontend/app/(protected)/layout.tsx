import { ensureAuthenticated } from "@/features/auth/ensure-authenticated.server";
import { Sidebar } from "./_components/Sidebar";
import { TopBar } from "./_components/TopBar";

export default async function ProtectedPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await ensureAuthenticated();

  return (
    <div className="min-h-screen bg-background p-4 lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden lg:p-10">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1400px] flex-col gap-6 lg:h-full lg:min-h-0 lg:flex-row lg:gap-[60px]">
        <aside className="w-full shrink-0 rounded-[30px] bg-primary lg:h-full lg:w-[280px]">
          <Sidebar />
        </aside>
        <main className="min-w-0 flex-1 lg:min-h-0 lg:overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-[1000px] flex-col gap-10 pt-2 lg:min-h-full lg:pt-5">
            <TopBar title="Dashboard" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

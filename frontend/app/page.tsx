import { AuthPanel } from "@/features/auth/components/AuthPanel";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[588px_1fr]">
        <aside className="flex min-h-[260px] items-center justify-center bg-primary px-6 text-primary-foreground lg:min-h-screen">
          <p className="font-heading text-[72px] leading-[88px] font-bold">
            Dash.
          </p>
        </aside>
        <section className="flex justify-center px-6 pt-16 pb-16 lg:items-start lg:justify-start lg:px-0 lg:pl-[244px] lg:pt-[260px]">
          <AuthPanel />
        </section>
      </div>
    </main>
  );
}

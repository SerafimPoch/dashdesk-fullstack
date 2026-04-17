import { ensureAuthenticated } from "@/features/auth/server/ensure-authenticated";

export default async function ProtectedPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await ensureAuthenticated();

  return <>{children}</>;
}

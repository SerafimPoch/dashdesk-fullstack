import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function ensureAuthenticated() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const response = await fetch(`${process.env.BACKEND_API_URL}/auth/me`, {
    headers: {
      Cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    redirect("/");
  }
}

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const backendResponse = await fetch(`${process.env.BACKEND_API_URL!}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await backendResponse.json();

  const response = NextResponse.json(data, {
    status: backendResponse.status,
  });

  const setCookie = backendResponse.headers.get("set-cookie");

  if (setCookie) {
    response.headers.set("set-cookie", setCookie);
  }

  return response;
}

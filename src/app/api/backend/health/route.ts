import { NextResponse } from "next/server";

export async function GET() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4100";

  try {
    const response = await fetch(`${apiBaseUrl}/health`, { cache: "no-store" });
    const payload = await response.json();
    return NextResponse.json({
      status: "ok",
      apiBaseUrl,
      backend: payload
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unreachable",
        apiBaseUrl,
        message: error instanceof Error ? error.message : "Backend no disponible"
      },
      { status: 503 }
    );
  }
}

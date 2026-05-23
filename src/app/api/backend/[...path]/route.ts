import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4100";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const target = new URL(`/${path.join("/")}`, apiBaseUrl);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));

  const response = await fetch(target, {
    method: request.method,
    headers: buildHeaders(request),
    body: request.method === "GET" ? undefined : await request.text(),
    cache: "no-store"
  });

  const contentType = response.headers.get("content-type") ?? "application/json; charset=utf-8";
  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type": contentType
    }
  });
}

function buildHeaders(request: NextRequest) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  return headers;
}

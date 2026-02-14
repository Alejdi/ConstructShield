import { filterMessage } from "@/lib/chat/filter";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { content } = await request.json();
  const result = filterMessage(content);
  return NextResponse.json(result);
}

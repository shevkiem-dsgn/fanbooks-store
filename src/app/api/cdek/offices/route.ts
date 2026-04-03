import { NextRequest, NextResponse } from "next/server";
import {
  getAllCdekOffices,
  searchCdekOffices,
} from "@/modules/shipping/cdek/server/offices";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") ?? "";
  const offices = searchCdekOffices(query);
  const sourceAvailable = getAllCdekOffices().length > 0;

  return NextResponse.json({
    offices,
    sourceAvailable,
  });
}

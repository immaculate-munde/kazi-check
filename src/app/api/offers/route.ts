import { NextResponse } from "next/server";
import { offerSchema } from "@/lib/http/schemas";
import { analyzeOfferLetter } from "@/lib/offer/analyze";
import { memorySaveOffer } from "@/lib/store/memory";

export const instant = false;

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = offerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const result = analyzeOfferLetter(parsed.data.text);
  memorySaveOffer(result);
  return NextResponse.json(result, { status: 201 });
}

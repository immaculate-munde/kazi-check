import { OfferResultClient } from "@/components/offer/OfferResultClient";

export const instant = false;

type Params = Promise<{ id: string }>;

export default async function OfferResultPage({ params }: { params: Params }) {
  const { id } = await params;
  return <OfferResultClient id={id} />;
}

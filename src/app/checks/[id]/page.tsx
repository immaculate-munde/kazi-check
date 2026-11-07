import { EvidenceView } from "@/components/check/EvidenceView";

export const instant = false;

type Params = Promise<{ id: string }>;

export default async function CheckResultPage({ params }: { params: Params }) {
  const { id } = await params;
  return <EvidenceView checkId={id} />;
}

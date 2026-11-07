import { SubjectDetailClient } from "@/components/registry/SubjectDetailClient";

export const instant = false;

type Params = Promise<{ subjectId: string }>;

export default async function SubjectDetailPage({ params }: { params: Params }) {
  const { subjectId } = await params;
  return <SubjectDetailClient subjectId={subjectId} />;
}

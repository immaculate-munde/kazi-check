import { SkillResultClient } from "@/components/skills/SkillResultClient";

export const instant = false;

type Params = Promise<{ id: string }>;

export default async function SkillResultPage({ params }: { params: Params }) {
  const { id } = await params;
  return <SkillResultClient id={id} />;
}

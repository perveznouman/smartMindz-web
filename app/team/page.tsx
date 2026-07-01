import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/Section";
import { TeamGrid } from "@/components/TeamGrid";
import { CtaBand } from "@/components/CtaBand";
import { getTeam } from "@/lib/data";

export const metadata: Metadata = {
  title: "Team",
  description: "Meet the team behind SmartMindz.",
};

export default async function TeamPage() {
  const team = await getTeam();

  return (
    <>
      <Section>
        <SectionHeader
          eyebrow="The Team"
          title="Meet the people behind SmartMindz"
          subtitle="A passionate team working to give every talent a stage."
        />
        <TeamGrid members={team} />
      </Section>
      <CtaBand />
    </>
  );
}

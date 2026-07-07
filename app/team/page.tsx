import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/Section";
import { TeamGrid } from "@/components/TeamGrid";
import { CtaBand } from "@/components/CtaBand";
import { getSiteContent, getTeam } from "@/lib/data";
import { isRegistrationOpen } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Team",
  description: "Meet the team behind SmartMindz.",
};

export default async function TeamPage() {
  const [team, content] = await Promise.all([getTeam(), getSiteContent()]);

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
      <CtaBand registrationOpen={isRegistrationOpen(content)} />
    </>
  );
}

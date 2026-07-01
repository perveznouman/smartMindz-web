import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { avatarPlaceholder } from "@/lib/utils";
import type { TeamMember } from "@/lib/types";

export function TeamGrid({ members }: { members: TeamMember[] }) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
      {members.map((member, i) => (
        <Reveal key={member.id} delay={i * 0.05}>
          <figure className="card flex flex-col items-center p-6 text-center transition-transform duration-300 hover:-translate-y-1">
            <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-brand/20">
              <Image
                src={member.photoUrl ?? avatarPlaceholder(member.name)}
                alt={member.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-4">
              <p className="font-semibold">{member.name}</p>
              <p className="mt-0.5 text-xs text-content-muted">{member.role}</p>
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}

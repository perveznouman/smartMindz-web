import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { avatarPlaceholder } from "@/lib/utils";
import type { TeamMember } from "@/lib/types";

export function TeamGrid({ members }: { members: TeamMember[] }) {
  return (
    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
      {members.map((member, i) => (
        <Reveal key={member.id} delay={i * 0.05}>
          <figure className="card flex h-[28rem] flex-col items-center justify-center p-8 text-center transition-transform duration-300 hover:-translate-y-2">
            <div className="relative h-32 w-32 overflow-hidden rounded-full ring-2 ring-brand/20 flex-shrink-0">
              <Image
                src={member.photoUrl ?? avatarPlaceholder(member.name)}
                alt={member.name}
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-6 flex flex-col justify-center">
              <p className="font-semibold text-base">{member.name}</p>
              <p className="mt-1 text-sm text-content-muted">{member.role}</p>
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}

import { RegisterButton } from "@/components/registration/RegisterButton";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "lucide-react";

export function CtaBand({
  title = "Your talent deserves the spotlight.",
  subtitle = "Join the revolution today — register for an upcoming event and shine.",
  registrationOpen = true,
}: {
  title?: string;
  subtitle?: string;
  registrationOpen?: boolean;
}) {
  return (
    <section className="container-page py-16">
      <Reveal direction="zoom">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12"
          style={{
            background:
              "linear-gradient(135deg, rgb(var(--c-brand)) 0%, rgb(var(--c-accent)) 100%)",
          }}
        >
          <h2 className="mx-auto max-w-2xl text-3xl font-bold text-white sm:text-4xl font-display">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/90">{subtitle}</p>
          <div className="mt-8">
            <RegisterButton
              disabled={!registrationOpen}
              className="btn bg-white px-7 py-3 text-base text-brand hover:-translate-y-0.5 hover:shadow-glow"
            >
              {registrationOpen ? "Register now" : "Registrations closed"}
              {registrationOpen && <ArrowRight className="h-4 w-4" />}
            </RegisterButton>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

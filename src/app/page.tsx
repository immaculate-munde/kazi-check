import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ModeCards } from "@/components/home/ModeCards";
import { RegistryTeaser } from "@/components/home/RegistryTeaser";

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="h-px w-full bg-kc-ink/15" />
      </div>
      <ModeCards />
      <HowItWorks />
      <RegistryTeaser />
    </>
  );
}

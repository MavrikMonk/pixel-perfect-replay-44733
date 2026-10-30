import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CompareSlider } from "@/components/makeover/CompareSlider";
import { Studio } from "@/components/makeover/Studio";
import heroBefore from "@/assets/sample-living.jpg";
import heroAfter from "@/assets/sample-living-japandi.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Interior Makeover — See your room in a new style" },
      {
        name: "description",
        content:
          "Upload a photo of your room, pick a style and see an AI makeover in seconds — before you spend a cent.",
      },
      { property: "og:title", content: "AI Interior Makeover" },
      {
        property: "og:description",
        content: "See your room in a new style before you spend a cent. Upload a photo, pick a style, compare.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <span className="font-display text-lg font-semibold">
          Interior<span className="text-primary">.</span>Makeover
        </span>
        <a href="#studio" className="text-sm font-semibold text-muted-foreground transition hover:text-foreground">
          Start
        </a>
      </header>

      <section className="paper-grain">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[1fr_1.15fr] lg:gap-14 lg:pb-28 lg:pt-14">
          <div>
            <p className="eyebrow mb-5">AI interior makeover</p>
            <h1 className="text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              See your room in a new style <em className="text-primary">before</em> you spend a cent.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              Snap your space, choose a look, and keep the pieces you love. Your walls, windows and layout stay
              exactly where they are.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <a href="#studio">
                  Start your makeover <ArrowDown />
                </a>
              </Button>
              <span className="text-sm text-muted-foreground">Free · no sign-up</span>
            </div>
          </div>
          <CompareSlider
            before={heroBefore}
            after={heroAfter}
            beforeAlt="A plain living room before the makeover"
            afterAlt="The same living room restyled in Japandi"
            priority
          />
        </div>
      </section>

      <div className="h-16 sm:h-24" />
      <Studio />

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-8">
          <span>AI Interior Makeover</span>
          <span>AI visualisations are for inspiration only.</span>
        </div>
      </footer>
    </main>
  );
}

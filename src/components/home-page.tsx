"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Dumbbell, Trophy, Users } from "lucide-react";
import { LazySection } from "@/components/lazy-section";
import { sessionPrograms, workoutLibraryCatalog } from "@/data/site";
import { formatNaira } from "@/lib/utils";

const quickPages = [
  {
    href: "/book",
    title: "Book a class",
    icon: CalendarDays
  },
  {
    href: "/workouts",
    title: "Workout library",
    icon: Dumbbell
  },
  {
    href: "/community",
    title: "Community",
    icon: Users
  },
  {
    href: "/dashboard",
    title: "Dashboard",
    icon: Trophy
  }
];

export function HomePage() {
  const featuredWorkouts = workoutLibraryCatalog.filter((workout) => workout.featured).slice(0, 3);

  return (
    <main className="page page-width page-stack">
      <LazySection className="hero-grid home-hero-grid" delay={120}>
        <section className="surface hero-surface card-stack">
          <span className="eyebrow">Xfitness</span>
          <h1 className="page-title">Train simply.</h1>
          <p className="page-copy">Book classes, follow workouts, and keep your progress in one place.</p>

          <div className="action-row">
            <Link href="/signup" className="button button-primary">
              Get started
            </Link>
            <Link href="/dashboard" className="button button-secondary">
              Open app
            </Link>
          </div>
        </section>

        <section className="surface hero-media-surface">
          <div className="media-frame hero-media-frame">
            <Image src="/media/hero-still.png" alt="Members training in the gym" fill sizes="(max-width: 1024px) 100vw, 46vw" />
          </div>
        </section>
      </LazySection>

      <LazySection className="section-stack" delay={220}>
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">Pages</span>
            <h2 className="section-title">Go straight to what you need</h2>
          </div>
        </div>

        <div className="section-rail">
          {quickPages.map((page) => {
            const Icon = page.icon;

            return (
              <Link key={page.href} href={page.href} className="surface rail-card action-card">
                <Icon size={18} />
                <strong>{page.title}</strong>
                <span className="inline-link">
                  Open <ArrowRight size={15} />
                </span>
              </Link>
            );
          })}
        </div>
      </LazySection>

      <LazySection className="surface section-stack" delay={320}>
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">Classes</span>
            <h2 className="section-title">Popular right now</h2>
          </div>
          <Link href="/book" className="inline-link">
            See all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="section-rail">
          {sessionPrograms.slice(0, 4).map((program) => (
            <article key={program.id} className="surface rail-card program-rail-card">
              <div className="media-frame rail-media-frame">
                <Image src={program.image} alt={program.name} fill sizes="320px" />
              </div>
              <div className="card-stack">
                <div className="split-line">
                  <strong className="card-title">{program.name}</strong>
                  <span className="chip chip-soft">{program.duration}</span>
                </div>
                <div className="meta-row">
                  <span>{program.intensity}</span>
                  <span>{formatNaira(program.price)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </LazySection>

      <LazySection className="surface-grid surface-grid-2" delay={420}>
        <Link href="/workouts" className="surface rail-panel">
          <span className="eyebrow">Workouts</span>
          <h2 className="section-title">Video sessions</h2>
          <p className="muted-text">{featuredWorkouts.length} featured routines ready to play.</p>
        </Link>

        <Link href="/community" className="surface rail-panel">
          <span className="eyebrow">Community</span>
          <h2 className="section-title">Challenges and chat</h2>
          <p className="muted-text">Join a challenge or drop into the discussion.</p>
        </Link>
      </LazySection>
    </main>
  );
}

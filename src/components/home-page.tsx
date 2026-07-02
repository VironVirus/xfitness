"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, CreditCard, Dumbbell, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { membershipPlans, sessionPrograms, testimonials } from "@/data/site";
import { formatNaira } from "@/lib/utils";

const heroStats = [
  { value: "2.5k+", label: "Members energized" },
  { value: "40+", label: "Classes weekly" },
  { value: "4 mins", label: "From profile to booking" }
];

const heroSlides = [
  "/media/hero-still.png",
  "/media/strength-zone.png",
  "/media/women-sculpt.png",
  "/media/group-energy.png",
  "/media/mobility-reset.png"
];

export function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 4200);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-media">
          {heroSlides.map((slide, index) => (
            <Image
              key={slide}
              src={slide}
              alt=""
              aria-hidden="true"
              className={index === activeSlide ? "hero-media-image active" : "hero-media-image"}
              fill
              priority={index === 0}
              sizes="100vw"
            />
          ))}
          <div className="hero-media-overlay" />
          <div className="hero-media-noise" />
        </div>

        <header className="site-header">
          <Link href="/" className="brand-lockup">
            <span className="brand-mark">XF</span>
            <span className="brand-type">Xfitness Club</span>
          </Link>
          <nav className="site-nav">
            <a href="#experience">Experience</a>
            <a href="#programs">Programs</a>
            <a href="#membership">Membership</a>
            <Link href="/workouts">Workouts</Link>
            <Link href="/community">Community</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/book" className="button button-secondary">
              Book session
            </Link>
          </nav>
        </header>

        <div className="hero-copy">
          <div className="eyebrow-row">
            <span className="eyebrow">Next-Level Gym Webapp</span>
            <span className="hero-pill">
              <Sparkles size={16} />
              Image slideshow
            </span>
          </div>
          <h1>Where premium training meets a premium digital experience.</h1>
          <p>
            Xfitness now feels like a modern fitness brand from the first frame: bold visuals, member profiles, dashboards, session booking, and Flutterwave-ready payments in one elegant flow.
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="button button-primary">
              Create member profile
            </Link>
            <Link href="/workouts" className="button button-secondary">
              Browse workout library
            </Link>
            <Link href="/community" className="button button-secondary">
              Explore community
            </Link>
          </div>

          <div className="hero-stats">
            {heroStats.map((stat) => (
              <article key={stat.label} className="hero-stat-card">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marquee-band">
        <div className="marquee-track">
          <span>Strength</span>
          <span>Booking</span>
          <span>Recovery</span>
          <span>Community</span>
          <span>Performance</span>
          <span>Payments</span>
          <span>Profiles</span>
          <span>Dashboards</span>
        </div>
      </section>

      <section id="experience" className="section section-grid">
        <div className="section-heading-block">
          <span className="eyebrow">Experience</span>
          <h2>Beautiful enough to sell the dream. Structured enough to run the gym.</h2>
          <p>
            The redesign balances brand drama with useful product structure, so visitors can admire the gym and members can actually manage their journey.
          </p>
        </div>

        <div className="experience-grid">
          <article className="feature-card feature-card-large visual-card">
            <Image src="/media/facility-lounge.png" alt="Stylish modern gym reception and lounge" fill sizes="(max-width: 1024px) 100vw, 60vw" />
            <div className="feature-card-copy">
              <span>Immersive first impression</span>
              <h3>Cinematic visuals lead the brand story before the copy enters.</h3>
            </div>
          </article>

          <article className="feature-card">
            <ShieldCheck size={20} />
            <h3>Supabase-ready architecture</h3>
            <p>Auth, member profiles, and bookings can persist to your Supabase database when your environment variables are connected.</p>
          </article>

          <article className="feature-card">
            <CreditCard size={20} />
            <h3>Flutterwave-ready checkout</h3>
            <p>Members can move from session selection to local payment options with verification handled on the server.</p>
          </article>

          <article className="feature-card">
            <Dumbbell size={20} />
            <h3>Workouts plus community</h3>
            <p>Video routines, favorites, challenge leaderboards, and live member discussion now live in one connected product.</p>
          </article>

          <article className="feature-card visual-chip-card">
            <Image src="/media/group-energy.png" alt="Gym members in an energetic guided class" fill sizes="(max-width: 1024px) 100vw, 30vw" />
            <div className="feature-card-copy">
              <span>Atmosphere</span>
              <h3>Every page feels active, coached, and aspirational.</h3>
            </div>
          </article>
        </div>
      </section>

      <section id="programs" className="section">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Programs</span>
            <h2>Classes and coaching built around how people actually train.</h2>
          </div>
          <Link href="/book" className="inline-link">
            Reserve your slot <ArrowRight size={16} />
          </Link>
        </div>

        <div className="program-card-grid">
          {sessionPrograms.map((program) => (
            <article key={program.id} className="program-card">
              <div className="program-card-media">
                <Image src={program.image} alt={program.name} fill sizes="(max-width: 1024px) 100vw, 25vw" />
              </div>
              <div className="program-card-copy">
                <div className="program-pill-row">
                  <span>{program.category}</span>
                  <span>{program.duration}</span>
                </div>
                <h3>{program.name}</h3>
                <p>{program.description}</p>
                <div className="program-meta-row">
                  <span>
                    <Dumbbell size={16} />
                    {program.intensity}
                  </span>
                  <span>
                    <CalendarDays size={16} />
                    {formatNaira(program.price)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section split-showcase">
        <article className="showcase-copy-card">
          <span className="eyebrow">Member Product</span>
          <h2>Profiles, dashboards, and booking flow in one joined-up system.</h2>
          <p>
            Instead of a brochure-only site, the webapp now sells, converts, and serves. A visitor can discover the brand, create a profile, manage sessions, and prepare payment in a single experience.
          </p>

          <div className="showcase-points">
            <div>
              <UserRound size={18} />
              <span>Member identity and training goals</span>
            </div>
            <div>
              <CalendarDays size={18} />
              <span>Session scheduling and coach visibility</span>
            </div>
            <div>
              <CreditCard size={18} />
              <span>Payment verification hooks for live transactions</span>
            </div>
          </div>
        </article>

        <article className="showcase-visual-card">
          <div className="dashboard-preview">
            <div className="preview-header">
              <span>Member dashboard</span>
              <span className="status-pill">live-ready</span>
            </div>
            <div className="preview-grid">
              <div>
                <strong>14 days</strong>
                <span>Current streak</span>
              </div>
              <div>
                <strong>4 bookings</strong>
                <span>Upcoming sessions</span>
              </div>
              <div>
                <strong>Performance</strong>
                <span>Current membership</span>
              </div>
              <div>
                <strong>Flutterwave</strong>
                <span>Payment rail</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section id="membership" className="section">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Membership</span>
            <h2>Plans that feel premium on screen and simple to buy.</h2>
          </div>
          <Link href="/signup" className="inline-link">
            Join now <ArrowRight size={16} />
          </Link>
        </div>

        <div className="pricing-grid">
          {membershipPlans.map((plan) => (
            <article key={plan.name} className={plan.name === "Performance" ? "pricing-card featured" : "pricing-card"}>
              <span className="plan-accent">{plan.accent}</span>
              <h3>{plan.name}</h3>
              <strong>{plan.price}/month</strong>
              <p>{plan.description}</p>
              <ul>
                {plan.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <Link href="/signup" className={plan.name === "Performance" ? "button button-primary" : "button button-secondary"}>
                Choose {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section testimonial-section">
        <div className="section-heading-block center">
          <span className="eyebrow">Social Proof</span>
          <h2>Built to look as serious as the gym feels in real life.</h2>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className="testimonial-card">
              <p>{testimonial.quote}</p>
              <strong>{testimonial.name}</strong>
              <span>{testimonial.role}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section cta-section">
        <div className="cta-panel">
          <div>
            <span className="eyebrow">Ready to launch</span>
            <h2>Open the member flow, connect your keys, and start taking bookings.</h2>
          </div>
          <div className="cta-actions">
            <Link href="/dashboard" className="button button-primary">
              View dashboard
            </Link>
            <Link href="/workouts" className="button button-secondary">
              Explore workouts
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import { LazySection } from "@/components/lazy-section";
import { useAuth } from "@/context/auth-context";

type AuthPageProps = {
  mode: "login" | "signup";
};

const benefits = [
  {
    icon: ShieldCheck,
    title: "Secure access",
    body: "Sign in with your email and password."
  },
  {
    icon: Target,
    title: "Personal setup",
    body: "Save your goal and preferred training style."
  },
  {
    icon: Sparkles,
    title: "Connected journey",
    body: "Bookings, workouts, badges, and community stay linked."
  }
];

export function AuthPage({ mode }: AuthPageProps) {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");

      if (mode === "login") {
        await signIn(email, password);
        router.push("/dashboard");
      } else {
        const result = await signUp({
          fullName: String(formData.get("fullName") ?? ""),
          email,
          password,
          goal: String(formData.get("goal") ?? ""),
          preferredWorkoutType: String(formData.get("preferredWorkoutType") ?? "")
        });

        if (result.requiresEmailConfirmation) {
          setMessage(`Check ${email} to confirm your account, then sign in.`);
          return;
        }

        router.push("/dashboard");
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page page-width auth-page">
      <LazySection className="auth-layout" delay={80}>
        <section className="surface card-stack auth-summary-card">
          <span className="eyebrow">Member access</span>
          <h1 className="page-title">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="page-copy">
            {mode === "login"
              ? "Open your dashboard, bookings, workouts, and community progress."
              : "Start with a short quiz so the app can shape your dashboard and workout recommendations."}
          </p>

          <div className="list-stack">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article key={benefit.title} className="list-card">
                  <Icon size={18} />
                  <div>
                    <strong>{benefit.title}</strong>
                    <p className="muted-text">{benefit.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="surface card-stack form-card">
          <div className="split-heading">
            <div className="section-heading">
              <span className="eyebrow">{mode === "login" ? "Sign in" : "Sign up"}</span>
              <h2 className="section-title">{mode === "login" ? "Continue training" : "Set up your profile"}</h2>
            </div>
            <Link href="/" className="button button-secondary compact-button">
              Back home
            </Link>
          </div>

          <form
            className="form-stack"
            action={async (formData) => {
              await handleSubmit(formData);
            }}
          >
            {mode === "signup" ? (
              <div className="field-grid">
                <label className="field">
                  <span>Full name</span>
                  <input type="text" name="fullName" placeholder="Adaeze Okafor" required />
                </label>

                <label className="field">
                  <span>Fitness goal</span>
                  <input type="text" name="goal" placeholder="Build strength" required />
                </label>
              </div>
            ) : null}

            {mode === "signup" ? (
              <label className="field">
                <span>Preferred workout</span>
                <select name="preferredWorkoutType" defaultValue="Strength training" required>
                  <option value="Strength training">Strength training</option>
                  <option value="HIIT and cardio">HIIT and cardio</option>
                  <option value="Weight loss circuits">Weight loss circuits</option>
                  <option value="Yoga and mobility">Yoga and mobility</option>
                  <option value="Athletic performance">Athletic performance</option>
                </select>
              </label>
            ) : null}

            <label className="field">
              <span>Email</span>
              <input type="email" name="email" placeholder="you@example.com" required />
            </label>

            <label className="field">
              <span>Password</span>
              <input type="password" name="password" placeholder="At least 8 characters" minLength={8} required />
            </label>

            {message ? <p className="message message-success">{message}</p> : null}
            {error ? <p className="message message-error">{error}</p> : null}

            <button type="submit" className="button button-primary full-width-button" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="footnote">
            {mode === "login" ? "Need an account?" : "Already have an account?"}{" "}
            <Link href={mode === "login" ? "/signup" : "/login"}>
              {mode === "login" ? "Create one" : "Sign in"}
            </Link>
          </p>
        </section>
      </LazySection>
    </main>
  );
}

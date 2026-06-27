"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";

type AuthPageProps = {
  mode: "login" | "signup";
};

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
          setMessage(`Check ${email} to confirm your account, then sign in to open your dashboard.`);
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
    <main className="auth-shell">
      <section className="auth-panel media-panel">
        <div className="eyebrow">Member Access</div>
        <h1>{mode === "login" ? "Welcome back to the club." : "Create your Xfitness profile."}</h1>
        <p>
          {mode === "login"
            ? "Sign in with your email and password to open your personalized fitness dashboard."
            : "Create your account, answer a quick fitness quiz, and save your profile to Supabase Auth and your member database."}
        </p>
        <div className="auth-highlight-grid">
          <article>
            <strong>Supabase Auth</strong>
            <span>Email and password sign-in with profile-based access</span>
          </article>
          <article>
            <strong>Fitness Quiz</strong>
            <span>Store goals and workout preferences in each member profile</span>
          </article>
          <article>
            <strong>Dashboard</strong>
            <span>Redirect members to a personalized experience after login</span>
          </article>
        </div>
      </section>

      <section className="auth-panel form-panel">
        <div className="auth-heading-row">
          <div>
            <span className="eyebrow">{mode === "login" ? "Sign In" : "Sign Up"}</span>
            <h2>{mode === "login" ? "Member login" : "Join the movement"}</h2>
          </div>
          <Link href="/" className="button button-secondary">
            Back home
          </Link>
        </div>

        <form
          className="auth-form"
          action={async (formData) => {
            await handleSubmit(formData);
          }}
        >
          {mode === "signup" ? (
            <>
              <label>
                <span>Full name</span>
                <input type="text" name="fullName" placeholder="Adaeze Okafor" required />
              </label>

              <label>
                <span>Fitness goal</span>
                <input type="text" name="goal" placeholder="Build strength and tone my lower body" required />
              </label>

              <label>
                <span>Preferred workout type</span>
                <select name="preferredWorkoutType" defaultValue="Strength training" required>
                  <option value="Strength training">Strength training</option>
                  <option value="HIIT and cardio">HIIT and cardio</option>
                  <option value="Weight loss circuits">Weight loss circuits</option>
                  <option value="Yoga and mobility">Yoga and mobility</option>
                  <option value="Athletic performance">Athletic performance</option>
                </select>
              </label>
            </>
          ) : null}

          <label>
            <span>Email address</span>
            <input type="email" name="email" placeholder="you@example.com" required />
          </label>

          <label>
            <span>Password</span>
            <input type="password" name="password" placeholder="At least 8 characters" minLength={8} required />
          </label>

          {message ? <p className="form-message">{message}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" className="button button-primary" disabled={loading}>
            {loading ? "Working..." : mode === "login" ? "Log in to dashboard" : "Create account and save quiz"}
          </button>
        </form>

        <p className="auth-footer">
          {mode === "login" ? "Need an account?" : "Already a member?"}{" "}
          <Link href={mode === "login" ? "/signup" : "/login"}>
            {mode === "login" ? "Create one now" : "Sign in here"}
          </Link>
        </p>
      </section>
    </main>
  );
}

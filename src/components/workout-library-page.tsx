"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Flame, Heart, PlayCircle, UserRound } from "lucide-react";
import { LazySection } from "@/components/lazy-section";
import { useAuth } from "@/context/auth-context";
import {
  completeWorkout,
  getWorkoutLibrarySnapshot,
  subscribeToWorkoutLibrary,
  toggleFavoriteWorkout,
  type WorkoutLibrarySnapshot
} from "@/lib/supabase";
import { formatShortDate } from "@/lib/utils";
import type { MemberWorkoutActivity, WorkoutVideo } from "@/types/app";

function getWorkoutTagSet(workouts: WorkoutVideo[], activityByWorkoutId: Map<string, MemberWorkoutActivity>) {
  const tagSet = new Set<string>();

  workouts.forEach((workout) => {
    const activity = activityByWorkoutId.get(workout.id);
    if (!activity?.favorited) {
      return;
    }

    workout.tags.forEach((tag) => tagSet.add(tag.toLowerCase()));
  });

  return tagSet;
}

function getRecommendationReason(
  workout: WorkoutVideo,
  memberKeywords: Set<string>,
  favoriteTrainers: Set<string>,
  favoriteTags: Set<string>
) {
  if (workout.tags.some((tag) => memberKeywords.has(tag.toLowerCase()))) {
    return `Fits your ${workout.targetGoal.toLowerCase()} goal.`;
  }

  if (favoriteTrainers.has(workout.trainer)) {
    return `More from ${workout.trainer}.`;
  }

  if (workout.tags.some((tag) => favoriteTags.has(tag.toLowerCase()))) {
    return "Matches what you save often.";
  }

  return workout.featured ? "Featured by the coaching team." : "Useful for your next training block.";
}

function buildRecommendations(
  workouts: WorkoutVideo[],
  activityByWorkoutId: Map<string, MemberWorkoutActivity>,
  memberGoal: string,
  preferredWorkoutType: string
) {
  const memberKeywords = new Set(
    `${memberGoal} ${preferredWorkoutType}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2)
  );
  const favoriteTrainers = new Set<string>();

  workouts.forEach((workout) => {
    if (activityByWorkoutId.get(workout.id)?.favorited) {
      favoriteTrainers.add(workout.trainer);
    }
  });

  const favoriteTags = getWorkoutTagSet(workouts, activityByWorkoutId);

  return [...workouts]
    .map((workout) => {
      const activity = activityByWorkoutId.get(workout.id);
      let score = workout.featured ? 2 : 0;

      if (workout.tags.some((tag) => memberKeywords.has(tag.toLowerCase()))) {
        score += 5;
      }

      if (favoriteTrainers.has(workout.trainer)) {
        score += 4;
      }

      if (workout.tags.some((tag) => favoriteTags.has(tag.toLowerCase()))) {
        score += 3;
      }

      if (!activity?.completedCount) {
        score += 1;
      }

      return {
        workout,
        score,
        reason: getRecommendationReason(workout, memberKeywords, favoriteTrainers, favoriteTags)
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}

export function WorkoutLibraryPage() {
  const { member, loading } = useAuth();
  const [snapshot, setSnapshot] = useState<WorkoutLibrarySnapshot | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [trainerFilter, setTrainerFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [workingKey, setWorkingKey] = useState("");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!member) {
      setSnapshot(null);
      return;
    }

    let active = true;

    const loadLibrary = async () => {
      try {
        const nextSnapshot = await getWorkoutLibrarySnapshot(member.uid);
        if (!active) {
          return;
        }

        setSnapshot(nextSnapshot);
        setError("");
      } catch (libraryError) {
        if (!active) {
          return;
        }

        setError(libraryError instanceof Error ? libraryError.message : "Unable to load the workout library.");
      }
    };

    void loadLibrary();

    const unsubscribe = subscribeToWorkoutLibrary(member.uid, () => {
      void loadLibrary();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [member]);

  const activityByWorkoutId = useMemo(() => {
    return new Map(snapshot?.activity.map((activity) => [activity.workoutId, activity]) ?? []);
  }, [snapshot?.activity]);

  const trainerRoutines = useMemo(() => {
    const grouped = new Map<string, { trainer: string; routines: number; focus: Set<string> }>();

    snapshot?.workouts.forEach((workout) => {
      const group = grouped.get(workout.trainer) ?? {
        trainer: workout.trainer,
        routines: 0,
        focus: new Set<string>()
      };

      group.routines += 1;
      group.focus.add(workout.category);
      grouped.set(workout.trainer, group);
    });

    return [...grouped.values()];
  }, [snapshot?.workouts]);

  if (loading) {
    return <main className="page page-width centered-state">Loading your workout library...</main>;
  }

  if (!member) {
    return (
      <main className="page page-width centered-state">
        <span className="eyebrow">Workout library</span>
        <h1 className="page-title">Create an account to unlock video workouts.</h1>
        <div className="action-row">
          <Link href="/signup" className="button button-primary">
            Create account
          </Link>
          <Link href="/" className="button button-secondary">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  const activeMember = member;

  const workouts = snapshot?.workouts ?? [];
  const progress = snapshot?.progress;
  const categoryOptions = ["all", ...new Set(workouts.map((workout) => workout.category))];
  const trainerOptions = ["all", ...new Set(workouts.map((workout) => workout.trainer))];
  const filteredWorkouts = workouts.filter((workout) => {
    const activity = activityByWorkoutId.get(workout.id);
    const categoryMatch = categoryFilter === "all" || workout.category === categoryFilter;
    const trainerMatch = trainerFilter === "all" || workout.trainer === trainerFilter;
    const favoriteMatch = !favoritesOnly || Boolean(activity?.favorited);
    const searchValue = deferredSearch.trim().toLowerCase();
    const searchMatch =
      !searchValue ||
      `${workout.title} ${workout.trainer} ${workout.category} ${workout.tags.join(" ")}`
        .toLowerCase()
        .includes(searchValue);

    return categoryMatch && trainerMatch && favoriteMatch && searchMatch;
  });

  const totalFavorites = snapshot?.activity.filter((activity) => activity.favorited).length ?? 0;
  const totalCompleted = snapshot?.activity.reduce((sum, activity) => sum + activity.completedCount, 0) ?? 0;
  const totalMinutes = snapshot?.activity.reduce((sum, activity) => sum + activity.totalMinutesCompleted, 0) ?? 0;
  const recommendations = buildRecommendations(
    workouts,
    activityByWorkoutId,
    activeMember.quiz.goal,
    activeMember.preferredWorkoutType
  );

  async function handleFavorite(workout: WorkoutVideo, favorited: boolean) {
    setWorkingKey(`favorite:${workout.id}`);
    setMessage("");
    setError("");

    try {
      await toggleFavoriteWorkout(activeMember.uid, workout.id, favorited);
      setMessage(favorited ? `${workout.title} saved.` : `${workout.title} removed from favorites.`);
    } catch (favoriteError) {
      setError(favoriteError instanceof Error ? favoriteError.message : "Unable to update favorites.");
    } finally {
      setWorkingKey("");
    }
  }

  async function handleComplete(workout: WorkoutVideo) {
    setWorkingKey(`complete:${workout.id}`);
    setMessage("");
    setError("");

    try {
      await completeWorkout(activeMember.uid, workout);
      setMessage(`${workout.title} marked complete.`);
    } catch (completionError) {
      setError(completionError instanceof Error ? completionError.message : "Unable to save completion.");
    } finally {
      setWorkingKey("");
    }
  }

  return (
    <main className="page page-width page-stack">
      <LazySection className="surface hero-surface page-stack" delay={80}>
        <div className="hero-grid compact-hero-grid">
          <div className="card-stack">
            <span className="eyebrow">Workout library</span>
            <h1 className="page-title">Train anytime</h1>
            <p className="page-copy">Save what you like and mark workouts as done.</p>
            <div className="chip-row">
              <span className="chip">{workouts.length} workouts</span>
              <span className="chip">{trainerRoutines.length} trainers</span>
            </div>
          </div>

          <div className="action-row">
            <Link href="/dashboard" className="button button-secondary">
              Dashboard
            </Link>
            <Link href="/community" className="button button-primary">
              Community
            </Link>
          </div>
        </div>

        {message ? <p className="message message-success">{message}</p> : null}
        {error ? <p className="message message-error">{error}</p> : null}

        <div className="surface-grid surface-grid-4">
          <article className="metric-card">
            <Heart size={18} />
            <strong className="metric-value">{totalFavorites}</strong>
            <span className="metric-label">Favorites</span>
          </article>
          <article className="metric-card">
            <CheckCircle2 size={18} />
            <strong className="metric-value">{totalCompleted}</strong>
            <span className="metric-label">Completions</span>
          </article>
          <article className="metric-card">
            <PlayCircle size={18} />
            <strong className="metric-value">{totalMinutes}</strong>
            <span className="metric-label">Minutes logged</span>
          </article>
          <article className="metric-card">
            <Flame size={18} />
            <strong className="metric-value">{progress?.weeklyWorkoutsCompleted ?? 0}</strong>
            <span className="metric-label">Weekly workouts</span>
          </article>
        </div>
      </LazySection>

      <LazySection className="surface section-stack" delay={120}>
        <div className="section-heading">
          <span className="eyebrow">Recommendations</span>
            <h2 className="section-title">For you</h2>
        </div>

        <div className="surface-grid surface-grid-3">
          {recommendations.map(({ workout, reason }) => (
            <article key={workout.id} className="surface card-stack subtle-surface">
              <strong className="card-title">{workout.title}</strong>
              <p className="muted-text">
                {workout.trainer} • {workout.durationMinutes} min
              </p>
              <span className="chip chip-accent">{reason}</span>
            </article>
          ))}
        </div>
      </LazySection>

      <LazySection className="surface section-stack" delay={160}>
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">Filters</span>
            <h2 className="section-title">Find a workout</h2>
          </div>
          <label className="toggle-pill">
            <input type="checkbox" checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} />
            <span>Favorites only</span>
          </label>
        </div>

        <div className="field-grid field-grid-wide">
          <label className="field">
            <span>Search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, trainer, tag" />
          </label>

          <label className="field">
            <span>Category</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All categories" : option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Trainer</span>
            <select value={trainerFilter} onChange={(event) => setTrainerFilter(event.target.value)}>
              {trainerOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All trainers" : option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </LazySection>

      <LazySection className="surface section-stack" delay={200}>
        <div className="section-heading">
          <span className="eyebrow">Trainer routines</span>
          <h2 className="section-title">Who leads what</h2>
        </div>

        <div className="surface-grid surface-grid-3">
          {trainerRoutines.map((trainer) => (
            <article key={trainer.trainer} className="surface card-stack subtle-surface">
              <div className="split-line">
                <strong className="card-title">{trainer.trainer}</strong>
                <span className="chip chip-soft">{trainer.routines} routines</span>
              </div>
              <p className="muted-text">{[...trainer.focus].join(" • ")}</p>
            </article>
          ))}
        </div>
      </LazySection>

      <LazySection className="video-grid" delay={240}>
        {filteredWorkouts.length ? (
          filteredWorkouts.map((workout) => {
            const activity = activityByWorkoutId.get(workout.id);
            const favoriteKey = `favorite:${workout.id}`;
            const completeKey = `complete:${workout.id}`;

            return (
              <article key={workout.id} className="surface card-stack workout-card">
                <div className="video-frame">
                  <video controls preload="metadata" poster={workout.posterImage} className="video-player">
                    <source src={workout.videoUrl} type="video/mp4" />
                  </video>
                </div>

                <div className="card-stack">
                  <div className="split-line">
                    <strong className="card-title">{workout.title}</strong>
                    <span className="chip chip-soft">{workout.durationMinutes} min</span>
                  </div>

                  <p className="muted-text">
                    <UserRound size={15} />
                    {workout.trainer} • {workout.category}
                  </p>

                  <p className="muted-text">{workout.description}</p>

                  <div className="chip-row">
                    <span className="chip">{workout.intensity}</span>
                    <span className="chip">{workout.caloriesBurn} cal</span>
                    <span className="chip">{workout.equipment.join(" • ")}</span>
                  </div>

                  <div className="split-line">
                    <div className="list-inline">
                      <span className="chip chip-soft">
                        {activity?.completedCount ?? 0} done
                        {activity?.lastCompletedAt ? ` • ${formatShortDate(activity.lastCompletedAt)}` : ""}
                      </span>
                    </div>
                    <div className="action-row compact-action-row">
                      <button
                        type="button"
                        className="button button-secondary compact-button"
                        disabled={workingKey === favoriteKey}
                        onClick={() => handleFavorite(workout, !activity?.favorited)}
                      >
                        {activity?.favorited ? "Saved" : "Save"}
                      </button>
                      <button
                        type="button"
                        className="button button-primary compact-button"
                        disabled={workingKey === completeKey}
                        onClick={() => handleComplete(workout)}
                      >
                        {workingKey === completeKey ? "Saving..." : "Complete"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <article className="surface centered-state">
            <h2 className="section-title">No workouts match your filters.</h2>
            <p className="muted-text">Clear a filter or search term to see more routines.</p>
          </article>
        )}
      </LazySection>
    </main>
  );
}

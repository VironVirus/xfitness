"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Flame,
  Heart,
  PlayCircle,
  Sparkles,
  Star,
  Target,
  UserRound
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  completeWorkout,
  getWorkoutLibrarySnapshot,
  subscribeToWorkoutLibrary,
  supabaseEnabled,
  toggleFavoriteWorkout,
  type WorkoutLibrarySnapshot
} from "@/lib/supabase";
import { formatLongDate, formatShortDate } from "@/lib/utils";
import type { MemberWorkoutActivity, WorkoutVideo } from "@/types/app";

function getLabelList(items: string[]) {
  return items.join(" • ");
}

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
    return `Matches your ${workout.targetGoal.toLowerCase()} goal.`;
  }

  if (favoriteTrainers.has(workout.trainer)) {
    return `More from ${workout.trainer}, one of your saved coaches.`;
  }

  if (workout.tags.some((tag) => favoriteTags.has(tag.toLowerCase()))) {
    return "Aligned with the workout themes you favorite most.";
  }

  if (workout.featured) {
    return "Featured by the coaching team for strong member momentum.";
  }

  return "Recommended to round out your training mix this week.";
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
  const [intensityFilter, setIntensityFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [workingKey, setWorkingKey] = useState("");

  useEffect(() => {
    if (!member) {
      setSnapshot(null);
      return;
    }

    let active = true;

    const loadLibrary = async () => {
      setLoadingData(true);

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
      } finally {
        if (active) {
          setLoadingData(false);
        }
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
    return <main className="route-shell centered-copy">Loading your workout library...</main>;
  }

  if (!member) {
    return (
      <main className="route-shell centered-copy">
        <span className="eyebrow">Workout Library</span>
        <h1>Create your member account to unlock the on-demand library.</h1>
        <p>Favorite routines, track completions, and get recommendations once your member profile is active.</p>
        <div className="stack-row">
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
  const intensityOptions = ["all", ...new Set(workouts.map((workout) => workout.intensity))];

  const filteredWorkouts = workouts.filter((workout) => {
    const activity = activityByWorkoutId.get(workout.id);
    const categoryMatch = categoryFilter === "all" || workout.category === categoryFilter;
    const trainerMatch = trainerFilter === "all" || workout.trainer === trainerFilter;
    const intensityMatch = intensityFilter === "all" || workout.intensity === intensityFilter;
    const favoriteMatch = !favoritesOnly || Boolean(activity?.favorited);

    return categoryMatch && trainerMatch && intensityMatch && favoriteMatch;
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
      setMessage(
        favorited
          ? `${workout.title} was added to your favorites.`
          : `${workout.title} was removed from your favorites.`
      );
    } catch (favoriteError) {
      setError(favoriteError instanceof Error ? favoriteError.message : "Unable to update favorites right now.");
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
      setMessage(`${workout.title} marked complete. Your weekly progress has been updated.`);
    } catch (completionError) {
      setError(completionError instanceof Error ? completionError.message : "Unable to save this completion.");
    } finally {
      setWorkingKey("");
    }
  }

  return (
    <main className="route-shell workout-library-layout">
      <section className="workout-library-main">
        <section className="workout-library-hero">
          <div>
            <span className="eyebrow">Workout Library</span>
            <h1>Train on demand with guided videos, favorite routines, and smarter recommendations.</h1>
            <p className="section-copy">
              Build your own training stack from coach-led routines. Favorites and completions sync to Supabase, and
              every finished session pushes your weekly progress forward automatically.
            </p>
            <div className="dashboard-status-row">
              <span className={`status-pill ${supabaseEnabled ? "live" : "disabled"}`}>
                {supabaseEnabled ? (loadingData ? "syncing library data" : "realtime from supabase") : "demo fallback"}
              </span>
              <span className="status-pill">{workouts.length} on-demand routines</span>
              <span className="status-pill">{trainerRoutines.length} trainers</span>
            </div>
          </div>

          <div className="dashboard-actions">
            <Link href="/dashboard" className="button button-secondary">
              Back to dashboard
            </Link>
            <Link href="/community" className="button button-secondary">
              Join community
            </Link>
            <Link href="/book" className="button button-primary">
              Book a coached class
            </Link>
          </div>
        </section>

        <section className="workout-filter-bar">
          <label className="filter-field">
            <span>Category</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All categories" : option}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Trainer</span>
            <select value={trainerFilter} onChange={(event) => setTrainerFilter(event.target.value)}>
              {trainerOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All trainers" : option}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Intensity</span>
            <select value={intensityFilter} onChange={(event) => setIntensityFilter(event.target.value)}>
              {intensityOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All intensities" : option}
                </option>
              ))}
            </select>
          </label>

          <label className="workout-favorites-toggle">
            <span>Saved only</span>
            <input type="checkbox" checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} />
          </label>
        </section>

        {message ? <p className="form-message">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        <section className="workout-card-grid">
          {filteredWorkouts.length ? (
            filteredWorkouts.map((workout) => {
              const activity = activityByWorkoutId.get(workout.id);
              const favorited = Boolean(activity?.favorited);
              const completedCount = activity?.completedCount ?? 0;
              const favoriteKey = `favorite:${workout.id}`;
              const completeKey = `complete:${workout.id}`;

              return (
                <article key={workout.id} className="workout-card">
                  <div className="workout-card-media">
                    <video controls preload="none" poster={workout.posterImage} className="workout-video">
                      <source src={workout.videoUrl} type="video/mp4" />
                    </video>
                  </div>

                  <div className="workout-card-copy">
                    <div className="workout-card-heading">
                      <div>
                        <span className="eyebrow">{workout.category}</span>
                        <h2>{workout.title}</h2>
                      </div>
                      <button
                        type="button"
                        className={favorited ? "favorite-chip active" : "favorite-chip"}
                        onClick={() => handleFavorite(workout, !favorited)}
                        disabled={workingKey === favoriteKey}
                      >
                        <Heart size={16} />
                        {workingKey === favoriteKey ? "Saving..." : favorited ? "Saved" : "Favorite"}
                      </button>
                    </div>

                    <p>{workout.description}</p>

                    <div className="workout-meta-grid">
                      <span>
                        <UserRound size={16} />
                        {workout.trainer}
                      </span>
                      <span>
                        <Clock3 size={16} />
                        {workout.durationMinutes} min
                      </span>
                      <span>
                        <Flame size={16} />
                        {workout.caloriesBurn} cal burn
                      </span>
                      <span>
                        <PlayCircle size={16} />
                        {workout.intensity}
                      </span>
                    </div>

                    <div className="workout-chip-row">
                      {workout.equipment.map((item) => (
                        <span key={item} className="workout-chip">
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="workout-card-footer">
                      <div className="workout-card-status">
                        <span className="status-pill">{workout.targetGoal}</span>
                        <span className={completedCount ? "status-pill completed" : "status-pill disabled"}>
                          {completedCount ? `${completedCount} complete` : "Not completed yet"}
                        </span>
                        {activity?.lastCompletedAt ? (
                          <span className="status-pill live">Last done {formatShortDate(activity.lastCompletedAt)}</span>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => handleComplete(workout)}
                        disabled={workingKey === completeKey}
                      >
                        {workingKey === completeKey ? "Saving..." : "Mark complete"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <article className="dashboard-panel empty-workout-state">
              <h2>No workouts match those filters.</h2>
              <p className="muted">Try another category, trainer, intensity, or turn off favorites-only mode.</p>
            </article>
          )}
        </section>
      </section>

      <aside className="workout-library-sidebar">
        <article className="dashboard-panel workout-sidebar-card">
          <div className="panel-heading">
            <h2>Library progress</h2>
            <span className="status-pill live">tracking live</span>
          </div>
          <div className="workout-summary-grid">
            <div className="insight-card">
              <Heart size={18} />
              <strong>{totalFavorites}</strong>
              <p>Favorite workouts saved for quick return visits.</p>
            </div>
            <div className="insight-card">
              <CheckCircle2 size={18} />
              <strong>{totalCompleted}</strong>
              <p>Total on-demand completions logged to your profile.</p>
            </div>
            <div className="insight-card">
              <Clock3 size={18} />
              <strong>{totalMinutes}</strong>
              <p>Minutes completed across your video routine history.</p>
            </div>
          </div>
          {progress ? (
            <p className="muted">
              This week: {progress.weeklyWorkoutsCompleted}/{progress.weeklyWorkoutGoal} workouts and{" "}
              {progress.weeklyCaloriesBurned}/{progress.weeklyCalorieGoal} calories toward your current target window.
            </p>
          ) : null}
        </article>

        <article className="dashboard-panel workout-sidebar-card">
          <div className="panel-heading">
            <h2>Recommended next</h2>
            <span className="status-pill">{activeMember.preferredWorkoutType}</span>
          </div>

          <div className="recommendation-list">
            {recommendations.map(({ workout, reason }) => {
              const activity = activityByWorkoutId.get(workout.id);

              return (
                <div key={workout.id} className="recommendation-card">
                  <div className="recommendation-header">
                    <strong>{workout.title}</strong>
                    {workout.featured ? (
                      <span className="status-pill live">
                        <Star size={14} />
                        Featured
                      </span>
                    ) : null}
                  </div>
                  <p>{reason}</p>
                  <div className="recommendation-meta">
                    <span>{workout.trainer}</span>
                    <span>{workout.durationMinutes} min</span>
                    <span>{activity?.completedCount ? `${activity.completedCount} done` : "Fresh pick"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="dashboard-panel workout-sidebar-card">
          <div className="panel-heading">
            <h2>Trainer routines</h2>
            <span className="status-pill">
              <Sparkles size={14} />
              curated
            </span>
          </div>

          <div className="trainer-routine-list">
            {trainerRoutines.map((trainer) => (
              <div key={trainer.trainer} className="trainer-routine-card">
                <strong>{trainer.trainer}</strong>
                <span>{trainer.routines} routines</span>
                <p>{getLabelList([...trainer.focus])}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-panel compact-panel">
          <div className="panel-heading">
            <h2>Recommendation logic</h2>
            <Target size={18} />
          </div>
          <p className="muted">
            Suggestions react to your goal, preferred workout type, saved coaches, and the training themes you favorite
            most.
          </p>
        </article>

        {snapshot?.activity.some((activity) => activity.lastCompletedAt) ? (
          <article className="dashboard-panel compact-panel">
            <div className="panel-heading">
              <h2>Last completion</h2>
              <CheckCircle2 size={18} />
            </div>
            <p className="muted">
              {
                formatLongDate(
                  [...snapshot.activity]
                    .filter((activity) => activity.lastCompletedAt)
                    .sort((left, right) => {
                      return (
                        new Date(right.lastCompletedAt ?? 0).getTime() -
                        new Date(left.lastCompletedAt ?? 0).getTime()
                      );
                    })[0]?.lastCompletedAt ?? activeMember.joinedOn
                )
              }
            </p>
          </article>
        ) : null}
      </aside>
    </main>
  );
}

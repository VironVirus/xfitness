"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Flame,
  Instagram,
  MessageSquare,
  Send,
  Share2,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  Video
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  createCommunityComment,
  createCommunityThread,
  getCommunitySnapshot,
  joinCommunityChallenge,
  saveChallengeProgress,
  subscribeToCommunity,
  supabaseEnabled,
  type CommunitySnapshot
} from "@/lib/supabase";
import { formatLongDate, formatShortDate } from "@/lib/utils";
import type {
  CommunityChallenge,
  CommunityForumThread,
  MemberChallengeProgress
} from "@/types/app";

const defaultThreadCategories = ["General", "Challenges", "Social", "Recovery", "Wins"];

function getChallengePercent(progressValue: number, targetValue: number) {
  if (targetValue <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((progressValue / targetValue) * 100));
}

function getLeaderboard(entries: MemberChallengeProgress[], challengeId: string) {
  return [...entries]
    .filter((entry) => entry.challengeId === challengeId)
    .sort((left, right) => {
      if (right.progressValue !== left.progressValue) {
        return right.progressValue - left.progressValue;
      }

      return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
    });
}

function getCommentCountMap(threads: CommunityForumThread[], comments: CommunitySnapshot["comments"]) {
  return threads.reduce((map, thread) => {
    map.set(
      thread.id,
      comments.filter((comment) => comment.threadId === thread.id).length
    );
    return map;
  }, new Map<string, number>());
}

function upsertChallengeProgress(
  entries: MemberChallengeProgress[],
  nextEntry: MemberChallengeProgress
) {
  const remainingEntries = entries.filter((entry) => {
    return !(entry.memberId === nextEntry.memberId && entry.challengeId === nextEntry.challengeId);
  });

  return [...remainingEntries, nextEntry];
}

function upsertThread(threads: CommunityForumThread[], nextThread: CommunityForumThread) {
  const remainingThreads = threads.filter((thread) => thread.id !== nextThread.id);
  return [nextThread, ...remainingThreads];
}

function appendComment(comments: CommunitySnapshot["comments"], nextComment: CommunitySnapshot["comments"][number]) {
  return [...comments.filter((comment) => comment.id !== nextComment.id), nextComment].sort((left, right) => {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
}

export function CommunityPage() {
  const { member, loading } = useAuth();
  const [snapshot, setSnapshot] = useState<CommunitySnapshot | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [workingKey, setWorkingKey] = useState("");
  const [selectedChallengeId, setSelectedChallengeId] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [progressInputs, setProgressInputs] = useState<Record<string, string>>({});
  const [threadForm, setThreadForm] = useState({
    title: "",
    body: "",
    category: defaultThreadCategories[0]
  });
  const [commentBody, setCommentBody] = useState("");

  useEffect(() => {
    if (!member) {
      setSnapshot(null);
      return;
    }

    let active = true;

    const loadCommunity = async () => {
      setLoadingData(true);

      try {
        const nextSnapshot = await getCommunitySnapshot();
        if (!active) {
          return;
        }

        setSnapshot(nextSnapshot);
        setError("");
      } catch (communityError) {
        if (!active) {
          return;
        }

        setError(communityError instanceof Error ? communityError.message : "Unable to load the community section.");
      } finally {
        if (active) {
          setLoadingData(false);
        }
      }
    };

    void loadCommunity();

    const unsubscribe = subscribeToCommunity(() => {
      void loadCommunity();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [member]);

  useEffect(() => {
    if (!snapshot?.challenges.length) {
      return;
    }

    if (!selectedChallengeId || !snapshot.challenges.some((challenge) => challenge.id === selectedChallengeId)) {
      setSelectedChallengeId(snapshot.challenges[0].id);
    }
  }, [selectedChallengeId, snapshot?.challenges]);

  useEffect(() => {
    if (!snapshot?.threads.length) {
      setSelectedThreadId("");
      return;
    }

    if (!selectedThreadId || !snapshot.threads.some((thread) => thread.id === selectedThreadId)) {
      setSelectedThreadId(snapshot.threads[0].id);
    }
  }, [selectedThreadId, snapshot?.threads]);

  if (loading) {
    return <main className="route-shell centered-copy">Loading the Xfitness community...</main>;
  }

  if (!member) {
    return (
      <main className="route-shell centered-copy">
        <span className="eyebrow">Community</span>
        <h1>Create your member account to unlock challenges and live discussion.</h1>
        <p>Join leaderboard events, track progress, and jump into the community feed once your member profile is active.</p>
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
  const challenges = snapshot?.challenges ?? [];
  const threads = snapshot?.threads ?? [];
  const comments = snapshot?.comments ?? [];
  const challengeProgress = snapshot?.challengeProgress ?? [];
  const memberProgressMap = challengeProgress.reduce((map, entry) => {
    if (entry.memberId === activeMember.uid) {
      map.set(entry.challengeId, entry);
    }

    return map;
  }, new Map<string, MemberChallengeProgress>());
  const sortedChallenges = [...challenges].sort((left, right) => Number(right.featured) - Number(left.featured));
  const selectedChallenge =
    sortedChallenges.find((challenge) => challenge.id === selectedChallengeId) ?? sortedChallenges[0] ?? null;
  const leaderboard = selectedChallenge ? getLeaderboard(challengeProgress, selectedChallenge.id) : [];
  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? threads[0] ?? null;
  const threadComments = selectedThread
    ? comments.filter((comment) => comment.threadId === selectedThread.id)
    : [];
  const threadCategories = Array.from(new Set([...defaultThreadCategories, ...threads.map((thread) => thread.category)]));
  const commentCountMap = getCommentCountMap(threads, comments);
  const joinedCount = memberProgressMap.size;
  const completedChallenges = [...memberProgressMap.values()].filter((entry) => {
    const challenge = challenges.find((item) => item.id === entry.challengeId);
    return challenge ? entry.progressValue >= challenge.targetValue : false;
  }).length;

  function updateProgressInput(challengeId: string, value: string) {
    setProgressInputs((current) => ({
      ...current,
      [challengeId]: value
    }));
  }

  async function handleJoinChallenge(challenge: CommunityChallenge) {
    setWorkingKey(`join:${challenge.id}`);
    setMessage("");
    setError("");

    try {
      const nextProgress = await joinCommunityChallenge(activeMember, challenge);
      setSnapshot((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          challengeProgress: upsertChallengeProgress(current.challengeProgress, nextProgress)
        };
      });
      updateProgressInput(challenge.id, String(nextProgress.progressValue));
      setMessage(`You joined ${challenge.title}. Log your first check-in to appear on the leaderboard.`);
    } catch (challengeError) {
      setError(challengeError instanceof Error ? challengeError.message : "Unable to join this challenge right now.");
    } finally {
      setWorkingKey("");
    }
  }

  async function handleSaveProgress(challenge: CommunityChallenge) {
    const rawValue = progressInputs[challenge.id] ?? "";
    const parsedValue = Number(rawValue);

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      setError(`Enter a valid ${challenge.metricLabel.toLowerCase()} value before saving.`);
      return;
    }

    setWorkingKey(`progress:${challenge.id}`);
    setMessage("");
    setError("");

    try {
      const nextProgress = await saveChallengeProgress(activeMember, challenge, parsedValue);
      setSnapshot((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          challengeProgress: upsertChallengeProgress(current.challengeProgress, nextProgress)
        };
      });
      updateProgressInput(challenge.id, String(nextProgress.progressValue));
      setMessage(`${challenge.title} progress updated. Leaderboard and streak data are now live.`);
    } catch (challengeError) {
      setError(challengeError instanceof Error ? challengeError.message : "Unable to save your progress.");
    } finally {
      setWorkingKey("");
    }
  }

  async function handleSocialShare(platform: "instagram" | "tiktok") {
    if (!selectedChallenge) {
      return;
    }

    const memberChallengeProgress = memberProgressMap.get(selectedChallenge.id);
    const shareUrl = `${window.location.origin}/community`;
    const shareText = memberChallengeProgress
      ? `I'm at ${memberChallengeProgress.progressValue} ${selectedChallenge.metricUnit} in the ${selectedChallenge.title} on Xfitness. ${selectedChallenge.shareHashtag}`
      : `I just joined the ${selectedChallenge.title} on Xfitness. ${selectedChallenge.shareHashtag}`;

    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      window.open(platform === "instagram" ? "https://www.instagram.com/" : "https://www.tiktok.com/", "_blank", "noopener,noreferrer");
      setMessage(`Share caption copied. Finish your post in ${platform === "instagram" ? "Instagram" : "TikTok"}.`);
    } catch {
      setError("Unable to prepare social share right now.");
    }
  }

  async function handleCreateThread() {
    if (!threadForm.title.trim() || !threadForm.body.trim()) {
      setError("Add both a thread title and a discussion prompt before posting.");
      return;
    }

    setWorkingKey("thread:create");
    setMessage("");
    setError("");

    try {
      const nextThread = await createCommunityThread(activeMember, {
        title: threadForm.title.trim(),
        body: threadForm.body.trim(),
        category: threadForm.category
      });
      setSnapshot((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          threads: upsertThread(current.threads, nextThread)
        };
      });
      setSelectedThreadId(nextThread.id);
      setThreadForm({
        title: "",
        body: "",
        category: threadForm.category
      });
      setMessage("Your thread is live. Members will see replies here in real time.");
    } catch (threadError) {
      setError(threadError instanceof Error ? threadError.message : "Unable to create this thread.");
    } finally {
      setWorkingKey("");
    }
  }

  async function handleCreateComment() {
    if (!selectedThread || !commentBody.trim()) {
      setError("Write a reply before posting to the discussion.");
      return;
    }

    setWorkingKey("comment:create");
    setMessage("");
    setError("");

    try {
      const nextComment = await createCommunityComment(activeMember, selectedThread.id, commentBody.trim());
      setSnapshot((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          comments: appendComment(current.comments, nextComment)
        };
      });
      setCommentBody("");
      setMessage("Reply posted. Everyone in the forum will see it update live.");
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : "Unable to post this reply.");
    } finally {
      setWorkingKey("");
    }
  }

  return (
    <main className="route-shell community-layout">
      <section className="community-main">
        <section className="community-hero">
          <div>
            <span className="eyebrow">Community</span>
            <h1>Challenge each other, share your progress, and talk live while the leaderboard moves.</h1>
            <p className="section-copy">
              The Xfitness community section blends coaching challenges, social momentum, and a live member forum into
              one place. Join events, log progress, and watch updates stream in through Supabase Realtime.
            </p>
            <div className="dashboard-status-row">
              <span className={`status-pill ${supabaseEnabled ? "live" : "disabled"}`}>
                {supabaseEnabled ? (loadingData ? "syncing community data" : "realtime from supabase") : "demo fallback"}
              </span>
              <span className="status-pill">{challenges.length} active challenges</span>
              <span className="status-pill">{threads.length} live forum threads</span>
            </div>
          </div>

          <div className="dashboard-actions">
            <Link href="/dashboard" className="button button-secondary">
              Back to dashboard
            </Link>
            <Link href="/settings" className="button button-secondary">
              Notification settings
            </Link>
            <Link href="/workouts" className="button button-primary">
              Open workouts
            </Link>
          </div>
        </section>

        {message ? <p className="form-message">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        <section className="community-challenge-grid">
          {sortedChallenges.map((challenge) => {
            const memberChallengeProgress = memberProgressMap.get(challenge.id);
            const progressValue = memberChallengeProgress?.progressValue ?? 0;
            const joined = Boolean(memberChallengeProgress);
            const percent = getChallengePercent(progressValue, challenge.targetValue);
            const joinKey = `join:${challenge.id}`;
            const progressKey = `progress:${challenge.id}`;

            return (
              <article
                key={challenge.id}
                className={selectedChallenge?.id === challenge.id ? "community-challenge-card selected" : "community-challenge-card"}
              >
                <button
                  type="button"
                  className="community-challenge-select"
                  onClick={() => setSelectedChallengeId(challenge.id)}
                >
                  <div className="community-challenge-media">
                    <Image
                      src={challenge.coverImage}
                      alt={challenge.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 360px"
                    />
                  </div>
                </button>

                <div className="community-challenge-copy">
                  <div className="community-challenge-heading">
                    <div>
                      <span className="eyebrow">{challenge.metricLabel}</span>
                      <h2>{challenge.title}</h2>
                    </div>
                    {challenge.featured ? (
                      <span className="status-pill live">
                        <Sparkles size={14} />
                        Featured
                      </span>
                    ) : null}
                  </div>

                  <p>{challenge.description}</p>

                  <div className="community-meta-grid">
                    <span>
                      <Target size={16} />
                      Target: {challenge.targetValue} {challenge.metricUnit}
                    </span>
                    <span>
                      <Trophy size={16} />
                      {challengeProgress.filter((entry) => entry.challengeId === challenge.id).length} members joined
                    </span>
                    <span>
                      <Flame size={16} />
                      {challenge.durationDays} day run
                    </span>
                    <span>
                      <Video size={16} />
                      Ends {formatShortDate(challenge.endsAt)}
                    </span>
                  </div>

                  <div className="community-progress-shell">
                    <div className="community-progress-bar">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <div className="community-progress-caption">
                      <strong>
                        {progressValue} / {challenge.targetValue} {challenge.metricUnit}
                      </strong>
                      <span>{joined ? `${percent}% to target` : "Join to start tracking"}</span>
                    </div>
                  </div>

                  <div className="community-challenge-actions">
                    {joined ? (
                      <>
                        <label className="community-progress-input">
                          <span>Log your latest {challenge.metricLabel.toLowerCase()}</span>
                          <input
                            type="number"
                            min="0"
                            value={progressInputs[challenge.id] ?? String(progressValue)}
                            onChange={(event) => updateProgressInput(challenge.id, event.target.value)}
                          />
                        </label>
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => handleSaveProgress(challenge)}
                          disabled={workingKey === progressKey}
                        >
                          {workingKey === progressKey ? "Saving..." : "Save progress"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => handleJoinChallenge(challenge)}
                        disabled={workingKey === joinKey}
                      >
                        {workingKey === joinKey ? "Joining..." : "Join challenge"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {selectedChallenge ? (
          <section className="community-detail-grid">
            <article className="dashboard-panel community-leaderboard-panel">
              <div className="panel-heading">
                <div>
                  <h2>{selectedChallenge.title} leaderboard</h2>
                  <p className="muted">{selectedChallenge.sharePrompt}</p>
                </div>
                <span className="status-pill">{selectedChallenge.shareHashtag}</span>
              </div>

              <div className="community-leaderboard-list">
                {leaderboard.length ? (
                  leaderboard.slice(0, 8).map((entry, index) => (
                    <div key={`${entry.memberId}:${entry.challengeId}`} className="community-leaderboard-row">
                      <div>
                        <strong>
                          #{index + 1} {entry.memberName}
                        </strong>
                        <span>
                          {entry.streakDays} day streak
                          {entry.lastCheckInAt ? ` · Updated ${formatShortDate(entry.lastCheckInAt)}` : ""}
                        </span>
                      </div>
                      <div className="history-price">
                        <strong>
                          {entry.progressValue} {selectedChallenge.metricUnit}
                        </strong>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="muted">No leaderboard entries yet. Join the challenge to become the first member on the board.</p>
                )}
              </div>
            </article>

            <article className="dashboard-panel community-share-panel">
              <div className="panel-heading">
                <div>
                  <h2>Share your run</h2>
                  <p className="muted">Copy a ready-to-post caption and finish the share in your social app of choice.</p>
                </div>
                <span className="status-pill live">
                  <Share2 size={14} />
                  social ready
                </span>
              </div>

              <div className="community-share-grid">
                <button type="button" className="button button-secondary" onClick={() => handleSocialShare("instagram")}>
                  <Instagram size={18} />
                  Share to Instagram
                </button>
                <button type="button" className="button button-secondary" onClick={() => handleSocialShare("tiktok")}>
                  <Video size={18} />
                  Share to TikTok
                </button>
              </div>

              <p className="muted">
                The share caption includes your challenge name, current progress, the community hashtag, and a link back
                to the Xfitness community page.
              </p>
            </article>
          </section>
        ) : null}

        <section className="community-forum-grid">
          <article className="dashboard-panel community-thread-compose">
            <div className="panel-heading">
              <div>
                <h2>Start a discussion</h2>
                <p className="muted">Ask for tips, celebrate wins, or pull the community into your next challenge sprint.</p>
              </div>
              <span className="status-pill live">
                <MessageSquare size={14} />
                live forum
              </span>
            </div>

            <div className="community-compose-fields">
              <label className="auth-form">
                <span>Category</span>
                <select
                  value={threadForm.category}
                  onChange={(event) => setThreadForm((current) => ({ ...current, category: event.target.value }))}
                >
                  {threadCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="auth-form">
                <span>Thread title</span>
                <input
                  type="text"
                  value={threadForm.title}
                  onChange={(event) => setThreadForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="What is helping you improve this week?"
                />
              </label>

              <label className="auth-form">
                <span>Prompt or question</span>
                <textarea
                  rows={4}
                  value={threadForm.body}
                  onChange={(event) => setThreadForm((current) => ({ ...current, body: event.target.value }))}
                  placeholder="Share your context so members know how to help."
                />
              </label>

              <button
                type="button"
                className="button button-primary"
                onClick={handleCreateThread}
                disabled={workingKey === "thread:create"}
              >
                {workingKey === "thread:create" ? "Posting..." : "Post thread"}
              </button>
            </div>
          </article>

          <article className="dashboard-panel community-thread-list-panel">
            <div className="panel-heading">
              <h2>Active threads</h2>
              <span className="status-pill">{threads.length} open</span>
            </div>

            <div className="community-thread-list">
              {threads.length ? (
                threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    className={selectedThread?.id === thread.id ? "community-thread-card active" : "community-thread-card"}
                    onClick={() => setSelectedThreadId(thread.id)}
                  >
                    <div className="community-thread-card-heading">
                      <strong>{thread.title}</strong>
                      <span className="status-pill">{thread.category}</span>
                    </div>
                    <p>{thread.body}</p>
                    <div className="community-thread-meta">
                      <span>{thread.memberName}</span>
                      <span>{commentCountMap.get(thread.id) ?? 0} replies</span>
                      <span>{formatShortDate(thread.createdAt)}</span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="muted">No threads yet. Start the first conversation and the community feed will fill from there.</p>
              )}
            </div>
          </article>
        </section>
      </section>

      <aside className="community-sidebar">
        <article className="dashboard-panel community-sidebar-card">
          <div className="panel-heading">
            <h2>Your momentum</h2>
            <span className="status-pill live">member view</span>
          </div>
          <div className="workout-summary-grid">
            <div className="insight-card">
              <Trophy size={18} />
              <strong>{joinedCount}</strong>
              <p>Challenges joined so far.</p>
            </div>
            <div className="insight-card">
              <Flame size={18} />
              <strong>{Math.max(0, ...[...memberProgressMap.values()].map((entry) => entry.streakDays), 0)}</strong>
              <p>Your longest active challenge streak.</p>
            </div>
            <div className="insight-card">
              <Target size={18} />
              <strong>{completedChallenges}</strong>
              <p>Challenges completed against the target.</p>
            </div>
          </div>
        </article>

        <article className="dashboard-panel community-sidebar-card">
          <div className="panel-heading">
            <h2>Selected thread</h2>
            <span className="status-pill">{selectedThread ? `${threadComments.length} replies` : "pick one"}</span>
          </div>

          {selectedThread ? (
            <>
              <div className="community-selected-thread">
                <strong>{selectedThread.title}</strong>
                <span>
                  {selectedThread.memberName} · {selectedThread.category} · {formatLongDate(selectedThread.createdAt)}
                </span>
                <p>{selectedThread.body}</p>
              </div>

              <div className="community-comment-list">
                {threadComments.length ? (
                  threadComments.map((comment) => (
                    <div key={comment.id} className="community-comment-card">
                      <strong>{comment.memberName}</strong>
                      <span>{formatLongDate(comment.createdAt)}</span>
                      <p>{comment.body}</p>
                    </div>
                  ))
                ) : (
                  <p className="muted">No replies yet. Add the first response and the thread will update live for everyone.</p>
                )}
              </div>

              <label className="auth-form">
                <span>Reply to thread</span>
                <textarea
                  rows={4}
                  value={commentBody}
                  onChange={(event) => setCommentBody(event.target.value)}
                  placeholder="Add your perspective, tip, or encouragement."
                />
              </label>

              <button
                type="button"
                className="button button-primary"
                onClick={handleCreateComment}
                disabled={workingKey === "comment:create"}
              >
                {workingKey === "comment:create" ? "Posting..." : "Post reply"}
              </button>
            </>
          ) : (
            <p className="muted">Select a thread from the left to read replies and join the conversation.</p>
          )}
        </article>

        <article className="dashboard-panel compact-panel">
          <div className="panel-heading">
            <h2>Forum updates</h2>
            <Send size={18} />
          </div>
          <p className="muted">
            New threads and comments stream into the page with Supabase Realtime, so members do not need to refresh to
            follow the conversation.
          </p>
        </article>

        <article className="dashboard-panel compact-panel">
          <div className="panel-heading">
            <h2>Creator loop</h2>
            <UserRound size={18} />
          </div>
          <p className="muted">
            Use the Instagram and TikTok share helpers to copy a caption, open the platform, and keep the community
            challenge visible outside the app.
          </p>
        </article>
      </aside>
    </main>
  );
}

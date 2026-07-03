"use client";

import Link from "next/link";
import { Instagram, MessageSquare, Send, Share2, Trophy, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { LazySection } from "@/components/lazy-section";
import { useAuth } from "@/context/auth-context";
import {
  createCommunityComment,
  createCommunityThread,
  getCommunitySnapshot,
  joinCommunityChallenge,
  saveChallengeProgress,
  subscribeToCommunity,
  type CommunitySnapshot
} from "@/lib/supabase";
import { formatShortDate } from "@/lib/utils";
import type {
  CommunityChallenge,
  CommunityForumThread,
  MemberChallengeProgress
} from "@/types/app";

const defaultThreadCategories = ["General", "Challenges", "Wins", "Recovery"];

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

function upsertChallengeProgress(entries: MemberChallengeProgress[], nextEntry: MemberChallengeProgress) {
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

        setError(communityError instanceof Error ? communityError.message : "Unable to load community.");
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
    return <main className="page page-width centered-state">Loading community...</main>;
  }

  if (!member) {
    return (
      <main className="page page-width centered-state">
        <span className="eyebrow">Community</span>
        <h1 className="page-title">Create an account to join challenges and comments.</h1>
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
  const selectedChallenge = challenges.find((challenge) => challenge.id === selectedChallengeId) ?? challenges[0] ?? null;
  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? threads[0] ?? null;
  const leaderboard = selectedChallenge ? getLeaderboard(challengeProgress, selectedChallenge.id) : [];
  const threadComments = selectedThread ? comments.filter((comment) => comment.threadId === selectedThread.id) : [];
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
      setMessage(`Joined ${challenge.title}.`);
    } catch (challengeError) {
      setError(challengeError instanceof Error ? challengeError.message : "Unable to join challenge.");
    } finally {
      setWorkingKey("");
    }
  }

  async function handleSaveProgress(challenge: CommunityChallenge) {
    const rawValue = progressInputs[challenge.id] ?? "";
    const parsedValue = Number(rawValue);

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      setError(`Enter a valid ${challenge.metricLabel.toLowerCase()} value.`);
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
      setMessage(`${challenge.title} updated.`);
    } catch (challengeError) {
      setError(challengeError instanceof Error ? challengeError.message : "Unable to save progress.");
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
      ? `I'm at ${memberChallengeProgress.progressValue} ${selectedChallenge.metricUnit} in ${selectedChallenge.title}. ${selectedChallenge.shareHashtag}`
      : `I just joined ${selectedChallenge.title}. ${selectedChallenge.shareHashtag}`;

    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      window.open(platform === "instagram" ? "https://www.instagram.com/" : "https://www.tiktok.com/", "_blank", "noopener,noreferrer");
      setMessage(`Share text copied for ${platform === "instagram" ? "Instagram" : "TikTok"}.`);
    } catch {
      setError("Unable to prepare social share.");
    }
  }

  async function handleCreateThread() {
    if (!threadForm.title.trim() || !threadForm.body.trim()) {
      setError("Add a title and message.");
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
      setMessage("Discussion posted.");
    } catch (threadError) {
      setError(threadError instanceof Error ? threadError.message : "Unable to create discussion.");
    } finally {
      setWorkingKey("");
    }
  }

  async function handleCreateComment() {
    if (!selectedThread || !commentBody.trim()) {
      setError("Write a comment first.");
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
      setMessage("Comment sent.");
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : "Unable to send comment.");
    } finally {
      setWorkingKey("");
    }
  }

  return (
    <main className="page page-width page-stack">
      <LazySection className="surface hero-surface page-stack" delay={80}>
        <div className="hero-grid compact-hero-grid">
          <div className="card-stack">
            <span className="eyebrow">Community</span>
            <h1 className="page-title">Challenges and chat</h1>
            <p className="page-copy">Join a challenge, update your score, or post a comment.</p>
            <div className="chip-row">
              <span className="chip">{joinedCount} joined</span>
              <span className="chip">{completedChallenges} completed</span>
            </div>
          </div>

          <div className="action-row">
            <Link href="/workouts" className="button button-secondary">
              Workouts
            </Link>
            <Link href="/dashboard" className="button button-primary">
              Dashboard
            </Link>
          </div>
        </div>

        {message ? <p className="message message-success">{message}</p> : null}
        {error ? <p className="message message-error">{error}</p> : null}

        <div className="surface-grid surface-grid-3">
          <article className="metric-card">
            <Trophy size={18} />
            <strong className="metric-value">{challenges.length}</strong>
            <span className="metric-label">Challenges</span>
          </article>
          <article className="metric-card">
            <MessageSquare size={18} />
            <strong className="metric-value">{threads.length}</strong>
            <span className="metric-label">Threads</span>
          </article>
          <article className="metric-card">
            <Send size={18} />
            <strong className="metric-value">{comments.length}</strong>
            <span className="metric-label">Comments</span>
          </article>
        </div>
      </LazySection>

      <LazySection className="surface section-stack" delay={120}>
        <div className="section-heading">
          <span className="eyebrow">Challenges</span>
          <h2 className="section-title">Join and track progress</h2>
        </div>

        <div className="surface-grid surface-grid-3">
          {challenges.map((challenge) => {
            const progress = memberProgressMap.get(challenge.id);
            const percent = progress ? getChallengePercent(progress.progressValue, challenge.targetValue) : 0;
            const progressKey = `progress:${challenge.id}`;
            const joinKey = `join:${challenge.id}`;

            return (
              <article
                key={challenge.id}
                className={`surface card-stack subtle-surface challenge-card${selectedChallenge?.id === challenge.id ? " challenge-card-active" : ""}`}
              >
                <button type="button" className="card-select-button" onClick={() => setSelectedChallengeId(challenge.id)}>
                  <div className="split-line">
                    <strong className="card-title">{challenge.title}</strong>
                    <span className="chip chip-soft">{challenge.durationDays} days</span>
                  </div>
                  <p className="muted-text">{challenge.description}</p>
                </button>

                <div className="progress-strip">
                  <span className="progress-fill" style={{ width: `${percent}%` }} />
                </div>

                <div className="split-line">
                  <span className="chip chip-accent">
                    {progress ? `${progress.progressValue}/${challenge.targetValue} ${challenge.metricUnit}` : challenge.metricLabel}
                  </span>
                  <span className="chip chip-soft">{percent}%</span>
                </div>

                {progress ? (
                  <div className="field-grid field-grid-wide">
                    <label className="field">
                      <span>{challenge.metricLabel}</span>
                      <input
                        inputMode="numeric"
                        value={progressInputs[challenge.id] ?? String(progress.progressValue)}
                        onChange={(event) => updateProgressInput(challenge.id, event.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      className="button button-primary compact-button"
                      onClick={() => handleSaveProgress(challenge)}
                      disabled={workingKey === progressKey}
                    >
                      {workingKey === progressKey ? "Saving..." : "Update"}
                    </button>
                  </div>
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
              </article>
            );
          })}
        </div>
      </LazySection>

      <LazySection className="surface-grid surface-grid-2" delay={160}>
        <section className="surface card-stack">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow">Leaderboard</span>
              <h2 className="section-title">{selectedChallenge?.title ?? "Challenge board"}</h2>
            </div>
            {selectedChallenge ? <span className="chip chip-soft">{selectedChallenge.metricUnit}</span> : null}
          </div>

          {leaderboard.length ? (
            <div className="list-stack">
              {leaderboard.slice(0, 8).map((entry, index) => (
                <div key={`${entry.memberId}-${entry.challengeId}`} className="list-row leaderboard-row">
                  <div>
                    <strong>
                      {index + 1}. {entry.memberName}
                    </strong>
                    <p className="muted-text">Updated {formatShortDate(entry.updatedAt)}</p>
                  </div>
                  <span className="chip chip-accent">
                    {entry.progressValue} {selectedChallenge?.metricUnit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-text">No entries yet.</p>
          )}
        </section>

        <section className="surface card-stack">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow">Share</span>
              <h2 className="section-title">Instagram or TikTok</h2>
            </div>
            <Share2 size={18} />
          </div>

          <p className="muted-text">{selectedChallenge?.sharePrompt ?? "Pick a challenge to prepare a share caption."}</p>

          <div className="action-row">
            <button type="button" className="button button-secondary compact-button" onClick={() => handleSocialShare("instagram")}>
              <Instagram size={16} />
              <span>Instagram</span>
            </button>
            <button type="button" className="button button-secondary compact-button" onClick={() => handleSocialShare("tiktok")}>
              <Video size={16} />
              <span>TikTok</span>
            </button>
          </div>
        </section>
      </LazySection>

      <LazySection className="surface-grid surface-grid-2 community-grid" delay={200}>
        <section className="surface card-stack">
          <div className="section-heading">
            <span className="eyebrow">New thread</span>
            <h2 className="section-title">Start a discussion</h2>
          </div>

          <div className="form-stack">
            <div className="field-grid">
              <label className="field">
                <span>Title</span>
                <input
                  value={threadForm.title}
                  onChange={(event) => setThreadForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Share a win"
                />
              </label>

              <label className="field">
                <span>Category</span>
                <select
                  value={threadForm.category}
                  onChange={(event) => setThreadForm((current) => ({ ...current, category: event.target.value }))}
                >
                  {defaultThreadCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Message</span>
              <textarea
                rows={4}
                value={threadForm.body}
                onChange={(event) => setThreadForm((current) => ({ ...current, body: event.target.value }))}
                placeholder="What do you want to talk about?"
              />
            </label>

            <button type="button" className="button button-primary" onClick={handleCreateThread} disabled={workingKey === "thread:create"}>
              {workingKey === "thread:create" ? "Posting..." : "Post thread"}
            </button>
          </div>

          <div className="list-stack">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`thread-card${selectedThread?.id === thread.id ? " thread-card-active" : ""}`}
                onClick={() => setSelectedThreadId(thread.id)}
              >
                <div className="split-line">
                  <strong>{thread.title}</strong>
                  <span className="chip chip-soft">{thread.category}</span>
                </div>
                <p className="muted-text">{thread.body}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="surface card-stack">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow">Comments</span>
              <h2 className="section-title">{selectedThread?.title ?? "Select a thread"}</h2>
            </div>
            {selectedThread ? <span className="chip chip-soft">{threadComments.length} comments</span> : null}
          </div>

          {selectedThread ? <p className="muted-text">{selectedThread.body}</p> : null}

          <div className="list-stack comment-list">
            {threadComments.length ? (
              threadComments.map((comment) => (
                <article key={comment.id} className="comment-card">
                  <div className="split-line">
                    <strong>{comment.memberName}</strong>
                    <span className="muted-text">{formatShortDate(comment.createdAt)}</span>
                  </div>
                  <p>{comment.body}</p>
                </article>
              ))
            ) : (
              <p className="muted-text">No comments yet.</p>
            )}
          </div>

          <label className="field">
            <span>Reply</span>
            <textarea
              rows={4}
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder="Add your comment"
            />
          </label>

          <button type="button" className="button button-primary" onClick={handleCreateComment} disabled={workingKey === "comment:create"}>
            {workingKey === "comment:create" ? "Sending..." : "Send comment"}
          </button>
        </section>
      </LazySection>
    </main>
  );
}

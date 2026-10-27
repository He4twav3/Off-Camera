/**
 * Where a creator's post stands, in four steps they can tell apart at a glance: grey while we check it is on their
 * account, amber while it is being reviewed, green once approved (its views count), red if it was not approved.
 * Pure, so the campaign page, the posts tab and the tests share it.
 */
export type PostStatusTone = "grey" | "amber" | "green" | "red";

export type PostStatus = { tone: PostStatusTone; label: string; detail: string };

export function postStatus(
  post: { state: string; rejectReason: string | null; lastError: string | null },
  counted: { inReview?: boolean; windowClosed: boolean; daysLeft: number | null; repost?: boolean } | null,
): PostStatus {
  if (post.state === "rejected")
    return { tone: "red", label: "Not approved", detail: post.rejectReason ?? "This post wasn't approved." };
  if (!counted)
    return { tone: "grey", label: "Checking", detail: post.lastError ?? "We're checking this post is on your account." };
  if (counted.inReview)
    return { tone: "amber", label: "Video being reviewed", detail: "It turns green once it's approved. Its views are already being counted." };
  const when = counted.windowClosed
    ? "Views are final."
    : counted.daysLeft === null
      ? "Views are being counted."
      : `Views count for ${counted.daysLeft} more ${counted.daysLeft === 1 ? "day" : "days"}.`;
  return { tone: "green", label: "Approved", detail: counted.repost ? `Repost: view pay only. ${when}` : when };
}

/** The colours for each step, the same everywhere. */
export const POST_STATUS_STYLES: Record<PostStatusTone, string> = {
  grey: "bg-muted text-muted-foreground",
  amber: "bg-amber-400/15 text-amber-400",
  green: "bg-emerald-400/15 text-emerald-400",
  red: "bg-destructive/10 text-destructive",
};

/** One line explaining the colours, for the top of a list of posts. */
export const POST_STATUS_KEY = "Grey: checking it's your post. Amber: being reviewed. Green: approved, views count. Red: not approved.";

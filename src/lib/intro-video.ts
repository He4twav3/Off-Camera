import "server-only";

import { videoVersion } from "@/lib/video-version";

/**
 * The one real intro clip, used in two places (the homepage hero and
 * /go) — a single source of truth for its (versioned) paths so both
 * stay in sync rather than each hand-rolling its own `?v=` call.
 */
const INTRO_VIDEO_PATH = "/intro/aron-intro.mp4";
const INTRO_POSTER_PATH = "/intro/aron-intro-poster.png";

export const INTRO_VIDEO_SRC = `${INTRO_VIDEO_PATH}?v=${videoVersion(INTRO_VIDEO_PATH)}`;
export const INTRO_VIDEO_POSTER = `${INTRO_POSTER_PATH}?v=${videoVersion(INTRO_POSTER_PATH)}`;

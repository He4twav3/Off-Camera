"use client";

import { Component, type ReactNode } from "react";

/**
 * A generic client-side error boundary. React only supports these as class
 * components — there's no hook equivalent (getDerivedStateFromError /
 * componentDidCatch have no functional-component form as of React 19).
 *
 * Without one somewhere in the tree, an uncaught error in *any* client
 * component (even a small decorative one, e.g. a third-party WebGL widget)
 * unmounts the nearest enclosing route segment entirely — everything past
 * the shared layout goes blank, which is a much worse failure than losing
 * just the one decorative bit that broke.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

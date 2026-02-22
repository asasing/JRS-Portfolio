import posthog from "posthog-js";

type EventProps = Record<string, string | number | boolean | string[] | undefined>;

export function capture(event: string, props?: EventProps): void {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(event, props);
  } catch {
    // silently skip if PostHog is not initialized
  }
}

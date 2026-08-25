export interface UpcomingEvent {
  slug: string;
  title: string;
  date: string;
  location: string;
  description: string;
  rsvpLink: string;
  coverImage: string;
  galleryPath: string;
}

// Keep only truly upcoming events here.
// Past events should live in src/content/pastEvents/ and use /past-events/{slug}/gallery.
export const FEATURED_HOME_EVENT: UpcomingEvent = {
  slug: "github-copilot-dev-days-mumbai-sep-2026",
  title: "Dev Days – Mumbai",
  date: "5 September 2026 · 10:00 AM",
  location: "Paytm, Andheri East",
  description:
    "A community-hosted GitHub Copilot Dev Days session: talks, live demos, and hands-on workshops for Mumbai’s builders.",
  rsvpLink: "https://scan.hackmum.in/devdays",
  coverImage: "",
  galleryPath: "",
};

export const UPCOMING_EVENTS: UpcomingEvent[] = [];

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
  slug: "dev-days-mangaluru-series-sep-2026",
  title: "Dev Days | Mangaluru Series",
  date: "10–19 September 2026",
  location: "Mangaluru & coastal campuses",
  description:
    "A multi-stop Dev Days tour across the Mangaluru region—campus sessions from 10 September, with the marquee professionals edition at UniCourt on 19 September.",
  rsvpLink: "https://www.meetup.com/mumbai-technology-meetup/events/316369683/",
  coverImage: "",
  galleryPath: "",
};

export const UPCOMING_EVENTS: UpcomingEvent[] = [];

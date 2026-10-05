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
  slug: "hacktoberfest-hack-day-mumbai-2026",
  title: "Hacktoberfest Hack Day Mumbai",
  date: "17 October 2026",
  location: "Mumbai, India",
  description:
    "Join Hackerspace Mumbai for a day of open-source contributions and community building at Hacktoberfest Hack Day Mumbai.",
  rsvpLink: "https://scan.hackmum.in/hacktoberfest26",
  coverImage: "",
  galleryPath: "",
};

export const UPCOMING_EVENTS: UpcomingEvent[] = [];

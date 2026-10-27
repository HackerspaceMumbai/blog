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
export const UPCOMING_EVENTS: UpcomingEvent[] = [];

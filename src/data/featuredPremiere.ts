import type { PremiereHeroConfig } from '../utils/premiere';

export const FEATURED_PREMIERE: PremiereHeroConfig | null = {
  enabled: true,
  title: 'From Root to Rootless: Hardening Containers on Azure & AKS',
  subtitle: 'Join our featured speaker premiere with Maninderjit Bindra as he demonstrates how to secure containers from root defaults to rootless microVM sandboxes.',
  startAt: '2026-07-30T21:00:00+05:30', // Adjust start time to your scheduled Premiere ISO timestamp
  endAt: '2026-07-30T21:58:00+05:30',   // Adjust end time based on video duration (~45 mins)
  watchUrl: 'https://www.youtube.com/watch?v=jMS8rMwqdXU',
  notifyUrl: 'https://www.youtube.com/watch?v=jMS8rMwqdXU',
  upcomingBadgeText: 'LIVE PREMIERE',
  liveBadgeText: 'LIVE NOW',
  watchButtonText: 'Watch on YouTube',
  notifyButtonText: 'Notify Me',
  liveButtonText: 'Join Live Stream',
};
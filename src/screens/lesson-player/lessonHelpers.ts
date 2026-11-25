export function parseDurationToSeconds(dur?: string): number {
  if (!dur) return 0;
  const trimmed = dur.trim().toLowerCase();
  if (!trimmed) return 0;
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }
  let totalSeconds = 0;
  let matched = false;
  const hrMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  if (hrMatch) {
    totalSeconds += parseFloat(hrMatch[1]) * 3600;
    matched = true;
  }
  const minMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)\b/i);
  if (minMatch) {
    totalSeconds += parseFloat(minMatch[1]) * 60;
    matched = true;
  }
  const secMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/i);
  if (secMatch) {
    totalSeconds += parseFloat(secMatch[1]);
    matched = true;
  }
  if (matched) return Math.round(totalSeconds);
  const mins = parseInt(trimmed, 10);
  return !isNaN(mins) ? mins * 60 : 0;
}

export function formatSeconds(sec: number): string {
  const mins = Math.floor(sec / 60);
  const remainder = sec % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
}

export function extractZoomMeetingUrl(sources: (string | undefined)[]): string | null {
  for (const src of sources) {
    if (!src) continue;
    const match = src.match(/https?:\/\/[^\s"'<>]*zoom\.us\/[^\s"'<>]*/i);
    if (match) {
      return match[0].replace(/&amp;/g, '&');
    }
  }
  return null;
}

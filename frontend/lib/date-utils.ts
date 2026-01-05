/**
 * Parses a timestamp string from the backend as UTC.
 * The backend returns timestamps without timezone info (e.g., "2026-01-04T12:04:32.25885")
 * which JavaScript's Date constructor treats as local time by default.
 * This function ensures they are correctly parsed as UTC.
 */
export function parseUTCTimestamp(timestamp: string | null | undefined): Date | null {
  if (!timestamp) return null;
  // Append 'Z' if no timezone info to treat as UTC
  const dateStr = timestamp.endsWith("Z") ? timestamp : timestamp + "Z";
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a UTC timestamp string for display in local time.
 * Returns the time in HH:MM format.
 */
export function formatTimeLocal(timestamp: string | null | undefined): string {
  const date = parseUTCTimestamp(timestamp);
  if (!date) return "Not started";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Formats a UTC timestamp string for display as full date and time in local time.
 */
export function formatDateTimeLocal(timestamp: string | null | undefined): string {
  const date = parseUTCTimestamp(timestamp);
  if (!date) return "";
  return date.toLocaleString();
}

/**
 * Gets the timestamp in milliseconds from a UTC timestamp string.
 * Useful for time calculations (elapsed time, durations, etc.)
 */
export function getTimestampMs(timestamp: string | null | undefined): number | null {
  const date = parseUTCTimestamp(timestamp);
  return date ? date.getTime() : null;
}

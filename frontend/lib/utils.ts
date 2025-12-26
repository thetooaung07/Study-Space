import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  return `${date.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })}` ;
}

export function formatTime(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  return `${date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}` ;
}

export function computeDuration(start?: string, end?: string | null) {
  if (!start) return "—";

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date(); // 👈 CURRENT TIME

  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs <= 0) return "—";

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;

  return `${hours} h ${minutes} min`;
}
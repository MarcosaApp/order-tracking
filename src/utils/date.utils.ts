export function formatTimeAgo(timestamp: number) {
  const now = Date.now();
  const diffInMilliseconds = now - timestamp;

  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInMonths / 12);

  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

  if (diffInMinutes < 1) return "En este momento";
  if (diffInHours < 1) return rtf.format(-diffInMinutes, "minute");
  if (diffInDays < 1) return rtf.format(-diffInHours, "hour");
  if (diffInMonths < 1) return rtf.format(-diffInDays, "day");
  if (diffInYears < 1) return rtf.format(-diffInMonths, "month");

  return rtf.format(-diffInYears, "year");
}

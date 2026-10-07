export function getBillingPeriod(activatedAt: Date, now: Date = new Date()) {
  const anchorDay = activatedAt.getUTCDate();

  const build = (year: number, month: number) => {
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(
      Date.UTC(
        year,
        month,
        Math.min(anchorDay, lastDay),
        activatedAt.getUTCHours(),
        activatedAt.getUTCMinutes(),
        activatedAt.getUTCSeconds(),
        activatedAt.getUTCMilliseconds(),
      ),
    );
  };

  let start = build(now.getUTCFullYear(), now.getUTCMonth());
  if (start > now) {
    start = build(now.getUTCFullYear(), now.getUTCMonth() - 1);
  }

  const end = build(start.getUTCFullYear(), start.getUTCMonth() + 1);

  return { start, end };
}
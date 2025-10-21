/**
 * Calculate percentage change between first half and second half of a trend array
 * @param trend Array of numbers representing the trend over time
 * @returns Percentage change (positive for increase, negative for decrease)
 */
export function calculatePercentageChange(trend: number[]): number {
  if (trend.length < 2) return 0;

  const midPoint = Math.floor(trend.length / 2);
  const firstHalf = trend.slice(0, midPoint);
  const secondHalf = trend.slice(midPoint);

  const firstHalfAvg =
    firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

  if (firstHalfAvg === 0) return secondHalfAvg > 0 ? 100 : 0;
  return Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100);
}

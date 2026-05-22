import { UserMetrics } from './metrics';

export interface ValueSummary {
  userId: string;
  userName: string;
  runsRecovered: number;
  hoursSaved: number;
}

/**
 * WHY THIS EXISTS:
 * This is an illustrative heuristic function that translates raw telemetry (runs recovered)
 * into a tangible business value metric (hours of manual recovery saved).
 * In a real production system, this would be calibrated against actual customer incident response times.
 */
export function computeValueSummary(metrics: UserMetrics): ValueSummary {
  // Heuristic: Every failed run that was recovered by a retry would have taken 
  // ~2.5 minutes of engineering time to investigate, manually replay, and verify.
  const minutesSavedPerRecovery = 2.5;

  const totalMinutesSaved = metrics.retriedAndRecoveredRuns * minutesSavedPerRecovery;
  const hoursSaved = totalMinutesSaved / 60;

  return {
    userId: metrics.userId,
    userName: metrics.userName,
    runsRecovered: metrics.retriedAndRecoveredRuns,
    // Round to one decimal place for readability
    hoursSaved: Math.round(hoursSaved * 10) / 10,
  };
}

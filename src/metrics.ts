export interface UserMetrics {
  userId: string;
  userName: string;
  totalRuns: number;
  retriedAndRecoveredRuns: number;
  failedRuns: number;
  avgDurationMs: number;
}

export interface MetricsSource {
  getUsers(): Promise<{ id: string; name: string }[]>;
  getUserMetrics(userId: string): Promise<UserMetrics>;
}

/**
 * WHY THIS EXISTS: 
 * For the purpose of this proof-of-concept, we need believable per-user telemetry numbers.
 * This simulated source returns fixed mock data to demonstrate the value computation.
 * In a real environment, swapping this out is a simple one-line change.
 */
export class SimulatedMetricsSource implements MetricsSource {
  async getUsers(): Promise<{ id: string; name: string }[]> {
    return [
      { id: 'user-acme', name: 'Acme Corp' },
      { id: 'user-globex', name: 'Globex Inc' },
    ];
  }

  async getUserMetrics(userId: string): Promise<UserMetrics> {
    if (userId === 'user-acme') {
      return {
        userId,
        userName: 'Acme Corp',
        totalRuns: 10500,
        retriedAndRecoveredRuns: 340,
        failedRuns: 12,
        avgDurationMs: 2500, // 2.5s per run
      };
    } else {
      return {
        userId,
        userName: 'Globex Inc',
        totalRuns: 42000,
        retriedAndRecoveredRuns: 1250,
        failedRuns: 45,
        avgDurationMs: 4000, // 4s per run
      };
    }
  }
}

/**
 * WHY THIS EXISTS:
 * This class documents how the production implementation would fetch real metrics.
 * It would use the Hatchet metrics API, querying Prometheus endpoints for
 * metrics like `hatchet_retried_tasks_total`.
 */
export class HatchetMetricsSource implements MetricsSource {
  async getUsers(): Promise<{ id: string; name: string }[]> {
    // In production: Fetch distinct users from your internal DB or Hatchet tenant list.
    throw new Error('Not implemented: Requires real Hatchet telemetry access.');
  }

  async getUserMetrics(userId: string): Promise<UserMetrics> {
    // In production: Use Hatchet's API to query Prometheus for:
    // - total task runs for this user
    // - retried tasks that eventually succeeded
    // - failed tasks
    // - average task execution time
    throw new Error('Not implemented: Requires real Hatchet telemetry access.');
  }
}

import type { DragyRun } from '@/types/dragy';

export function formatTime(seconds: number): string {
    return seconds.toFixed(2);
}

// Positive when the tuned run is quicker.
export function deltaSeconds(stock: number, tuned: number): number {
    return stock - tuned;
}

export function percentQuicker(stock: number, tuned: number): number {
    return ((stock - tuned) / stock) * 100;
}

const isLater = (a: DragyRun, b: DragyRun): boolean =>
    a.recorded_on > b.recorded_on ||
    (a.recorded_on === b.recorded_on && a.id > b.id);

// The largest relative 100–200 gain; otherwise the latest run that still has
// a stock time (1/4 mile); otherwise null. A run without a stock time is never
// featured. 2.3 moves this rule to the server.
export function pickFeatured(runs: DragyRun[]): DragyRun | null {
    let best: DragyRun | null = null;
    let bestGain = -Infinity;

    for (const run of runs) {
        if (run.stock_100_200 === null || run.tuned_100_200 === null) {
            continue;
        }

        const gain = percentQuicker(run.stock_100_200, run.tuned_100_200);

        if (gain > bestGain) {
            best = run;
            bestGain = gain;
        }
    }

    if (best) {
        return best;
    }

    for (const run of runs) {
        if (
            run.stock_quarter_mile === null ||
            run.tuned_quarter_mile === null
        ) {
            continue;
        }

        if (best === null || isLater(run, best)) {
            best = run;
        }
    }

    return best;
}

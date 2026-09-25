import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { deltaSeconds, formatTime, percentQuicker } from '@/lib/dragy';
import { cn } from '@/lib/utils';
import type { DragyRun } from '@/types/dragy';

type Props = {
    runs: DragyRun[];
};

const METRICS = {
    '100-200': {
        label: '100–200 km/h',
        stock: (run: DragyRun) => run.stock_100_200,
        tuned: (run: DragyRun) => run.tuned_100_200,
        trap: false,
    },
    quarter: {
        label: '1/4 mile',
        stock: (run: DragyRun) => run.stock_quarter_mile,
        tuned: (run: DragyRun) => run.tuned_quarter_mile,
        trap: true,
    },
};

type MetricKey = keyof typeof METRICS;

// Rows shown before "Show all".
const FIRST = 6;

// Marque logos in public/images/brands (Simple Icons and Wikimedia Commons),
// keyed by the fixture's vehicle names. Decorative: the name is right beside it.
// ponytail: name lookup until runs carry their own make (2.3).
const BRANDS: Record<string, string> = {
    'Nissan GT-R (R35)': 'nissan',
    'Porsche 911 Turbo S': 'porsche',
    'Mercedes-AMG E 63 S 4MATIC+ Estate (S213) Final Edition': 'mercedes',
    'Toyota GR Yaris': 'toyota',
    'VW Golf R (Mk8)': 'volkswagen',
    'BMW M340i xDrive (G20)': 'bmw',
    'Cupra Formentor VZ5': 'cupra',
    'Škoda Octavia RS (Mk4)': 'skoda',
};

export function DragyBoard({ runs: allRuns }: Props) {
    // A run without its proof link is not listed.
    const runs = allRuns.filter((run) => run.proof_url !== null);
    const available = (Object.keys(METRICS) as MetricKey[]).filter((key) =>
        runs.some((run) => METRICS[key].tuned(run) !== null),
    );
    const [metric, setMetric] = useState<MetricKey | undefined>(available[0]);
    const [expanded, setExpanded] = useState(false);
    const firstHidden = useRef<HTMLLIElement>(null);
    const focusOnExpand = useRef(false);
    const sectionRef = useRef<HTMLElement>(null);
    // `data-reveal` keys that have scrolled into view. Hidden states are
    // motion-safe only, so with reduced motion everything is simply there.
    const [revealed, setRevealed] = useState<Set<string>>(() => new Set());

    useEffect(() => {
        if (expanded && focusOnExpand.current) {
            focusOnExpand.current = false;
            firstHidden.current?.focus();
        }
    }, [expanded]);

    // Re-run when rows mount (tab switch, "Show all") so new rows get watched.
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const keys = entries
                    .filter((entry) => entry.isIntersecting)
                    .map((entry) => {
                        observer.unobserve(entry.target);

                        return (entry.target as HTMLElement).dataset.reveal!;
                    });

                if (keys.length > 0) {
                    setRevealed((prev) =>
                        keys.every((key) => prev.has(key))
                            ? prev
                            : new Set([...prev, ...keys]),
                    );
                }
            },
            { rootMargin: '0px 0px -10% 0px' },
        );

        sectionRef.current
            ?.querySelectorAll('[data-reveal]')
            .forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [metric, expanded]);

    if (metric === undefined) {
        return null;
    }

    const m = METRICS[metric];
    const rows = runs.filter((run) => m.tuned(run) !== null);
    // One scale per tab, so bars compare across rows.
    const longest = Math.max(
        ...rows.flatMap((run) => [m.stock(run) ?? 0, m.tuned(run) ?? 0]),
    );
    const shown = expanded ? rows : rows.slice(0, FIRST);
    const headIn = revealed.has('head');

    return (
        <section
            ref={sectionRef}
            id="dragy"
            aria-labelledby="dragy-title"
            className="border-line relative overflow-hidden border-b"
        >
            <div className="mx-auto max-w-7xl px-4 pt-20 pb-24 lg:px-8">
                <div
                    data-reveal="head"
                    className={cn(
                        'flex flex-wrap items-end justify-between gap-6 transition duration-700 ease-out',
                        !headIn &&
                            'motion-safe:-translate-x-24 motion-safe:-skew-x-12 motion-safe:opacity-0',
                    )}
                >
                    {/* DRAFT copy, final in 3.2 */}
                    <h2
                        id="dragy-title"
                        className="text-4xl font-extrabold uppercase italic lg:text-5xl"
                    >
                        Every run, on the clock.
                    </h2>

                    {available.length > 1 ? (
                        <ToggleGroup
                            type="single"
                            value={metric}
                            onValueChange={(value) => {
                                // Radix sends '' when the active item is pressed again.
                                if (value) {
                                    setMetric(value as MetricKey);
                                    setExpanded(false);
                                }
                            }}
                            aria-label="Metric"
                            className="border-line rounded-none border"
                        >
                            {available.map((key) => (
                                <ToggleGroupItem
                                    key={key}
                                    value={key}
                                    className="text-smoke hover:text-chalk data-[state=on]:bg-chalk data-[state=on]:text-ink min-h-11 rounded-none px-4 font-mono text-sm uppercase first:rounded-none last:rounded-none hover:bg-transparent"
                                >
                                    {METRICS[key].label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    ) : (
                        <p className="text-smoke font-mono text-sm uppercase">
                            {m.label}
                        </p>
                    )}
                </div>

                <ol className="md:border-line mt-10 space-y-4 md:space-y-0 md:border-t">
                    {shown.map((run, i) => {
                        const stock = m.stock(run);
                        const tuned = m.tuned(run)!;
                        const lanes = [
                            ...(stock !== null
                                ? [
                                      {
                                          label: 'Stock',
                                          time: stock,
                                          text: 'text-smoke',
                                          bar: 'bg-smoke',
                                      },
                                  ]
                                : []),
                            {
                                label: 'GTECH',
                                time: tuned,
                                text: 'text-chalk font-semibold',
                                bar: 'bg-gtech-red',
                            },
                        ];
                        const trap = m.trap && run.tuned_trap_speed !== null;
                        const key = `row-${run.id}`;
                        const seen = revealed.has(key);
                        // Rows that arrive together land one after another.
                        const delay = (i % FIRST) * 70;

                        return (
                            <li
                                key={run.id}
                                ref={i === FIRST ? firstHidden : undefined}
                                tabIndex={i === FIRST ? -1 : undefined}
                                data-reveal={key}
                                style={{ transitionDelay: `${delay}ms` }}
                                className={cn(
                                    'border-line bg-asphalt-raised grid gap-4 border p-4 transition duration-500 ease-out md:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1.4fr)_5rem_auto] md:items-center md:gap-6 md:border-x-0 md:border-t-0 md:bg-transparent md:px-0 md:py-5',
                                    !seen &&
                                        'motion-safe:translate-y-6 motion-safe:opacity-0',
                                )}
                            >
                                {/* Painted through the logo as a mask, so it takes the theme colour. */}
                                <span
                                    aria-hidden="true"
                                    className="bg-smoke block h-8 w-16 md:justify-self-center"
                                    style={
                                        BRANDS[run.vehicle]
                                            ? {
                                                  mask: `url(/images/brands/${BRANDS[run.vehicle]}.svg) center / contain no-repeat`,
                                              }
                                            : { visibility: 'hidden' }
                                    }
                                />

                                <div>
                                    <div className="flex items-center gap-3">
                                        <p
                                            title={run.vehicle}
                                            className="min-w-0 truncate font-semibold"
                                        >
                                            {run.vehicle}
                                        </p>
                                        <span className="bg-chalk text-ink inline-block shrink-0 -skew-x-12 px-2 py-0.5 font-mono text-xs font-semibold uppercase">
                                            <span className="inline-block skew-x-12">
                                                {run.stage}
                                            </span>
                                        </span>
                                    </div>
                                    {run.mods && (
                                        <p className="text-smoke mt-1 text-sm">
                                            {run.mods}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <ul>
                                        {lanes.map((lane) => (
                                            <li
                                                key={lane.label}
                                                className={cn(
                                                    'grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 py-1 font-mono text-sm',
                                                    lane.text,
                                                )}
                                            >
                                                <span className="text-xs uppercase">
                                                    {lane.label}
                                                </span>
                                                {/* The right padding keeps room for the time at the bar's end. */}
                                                <div className="h-5 overflow-hidden pr-20">
                                                    {/* Width eases on a tab switch; the bar itself fills from the left once the row is in view. */}
                                                    <div
                                                        className="relative h-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                                                        style={{
                                                            width: `${(lane.time / longest) * 100}%`,
                                                        }}
                                                    >
                                                        <div
                                                            aria-hidden="true"
                                                            style={{
                                                                transitionDelay: `${delay + 150}ms`,
                                                            }}
                                                            className={cn(
                                                                'mr-1 -ml-2 h-full origin-left -skew-x-12 transition-transform duration-700 ease-out',
                                                                lane.bar,
                                                                !seen &&
                                                                    'motion-safe:scale-x-0',
                                                            )}
                                                        />
                                                        <span
                                                            style={{
                                                                transitionDelay: `${delay + 700}ms`,
                                                            }}
                                                            className={cn(
                                                                'absolute inset-y-0 left-full ml-1 flex items-center whitespace-nowrap tabular-nums transition-opacity duration-300',
                                                                !seen &&
                                                                    'motion-safe:opacity-0',
                                                            )}
                                                        >
                                                            {formatTime(
                                                                lane.time,
                                                            )}{' '}
                                                            s
                                                        </span>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    {trap && (
                                        <p className="text-smoke mt-1 font-mono text-xs uppercase">
                                            trap{' '}
                                            {run.stock_trap_speed !== null && (
                                                <>
                                                    {run.stock_trap_speed}{' '}
                                                    <ArrowRight
                                                        aria-hidden="true"
                                                        className="inline size-3"
                                                    />
                                                    <span className="sr-only">
                                                        to
                                                    </span>{' '}
                                                </>
                                            )}
                                            {run.tuned_trap_speed} km/h
                                        </p>
                                    )}
                                </div>

                                <p className="md:text-right">
                                    {stock !== null && (
                                        <>
                                            <span className="text-gtech-red block text-lg leading-none font-extrabold italic">
                                                −
                                                {formatTime(
                                                    deltaSeconds(stock, tuned),
                                                )}
                                                <span className="text-[0.6em]">
                                                    {' '}
                                                    s
                                                </span>
                                            </span>
                                            <span className="text-signal mt-1 block font-mono text-xs uppercase">
                                                {percentQuicker(
                                                    stock,
                                                    tuned,
                                                ).toFixed(1)}
                                                %
                                            </span>
                                        </>
                                    )}
                                </p>

                                <div className="md:text-right">
                                    {run.proof_url && (
                                        <a
                                            href={run.proof_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="border-gtech-red bg-gtech-red/10 text-chalk hover:bg-gtech-red/25 inline-flex min-h-11 items-center gap-2 border px-4 font-mono text-xs uppercase transition-colors"
                                        >
                                            Details
                                            <ArrowUpRight
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                            <span className="sr-only">
                                                {' '}
                                                for {run.vehicle} (opens in a
                                                new tab)
                                            </span>
                                        </a>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>

                {!expanded && rows.length > FIRST && (
                    <button
                        type="button"
                        onClick={() => {
                            focusOnExpand.current = true;
                            setExpanded(true);
                        }}
                        className="border-line text-chalk hover:border-chalk mt-6 inline-flex min-h-11 items-center border px-6 font-mono text-sm uppercase transition-colors"
                    >
                        Show all {rows.length} runs
                    </button>
                )}
            </div>
        </section>
    );
}

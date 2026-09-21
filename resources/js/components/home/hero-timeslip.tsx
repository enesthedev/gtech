import { Link } from '@inertiajs/react';
import {
    deltaSeconds,
    formatTime,
    percentQuicker,
    pickFeatured,
} from '@/lib/dragy';
import { cn } from '@/lib/utils';
import { register } from '@/routes';
import type { DragyRun } from '@/types/dragy';

type Props = {
    runs: DragyRun[];
};

// The race replay: lanes fill at this fraction of the real run time.
const REPLAY = 0.35;

type Metric = { label: string; stock: number; tuned: number };

// 100–200 when the run has it; pickFeatured falls back to 1/4 mile otherwise.
function mainMetric(run: DragyRun): Metric | null {
    if (run.stock_100_200 !== null && run.tuned_100_200 !== null) {
        return {
            label: '100–200 km/h',
            stock: run.stock_100_200,
            tuned: run.tuned_100_200,
        };
    }

    if (run.stock_quarter_mile !== null && run.tuned_quarter_mile !== null) {
        return {
            label: '1/4 mile',
            stock: run.stock_quarter_mile,
            tuned: run.tuned_quarter_mile,
        };
    }

    return null;
}

export function HeroTimeslip({ runs }: Props) {
    const run = pickFeatured(runs);
    const metric = run && mainMetric(run);
    const text = metric ? 'lg:col-span-7' : 'max-w-3xl';

    return (
        <section aria-labelledby="hero-title" className="border-line border-b">
            <div
                className={cn(
                    'mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:gap-x-12 lg:px-8 lg:py-24',
                    metric && 'lg:grid-cols-12',
                )}
            >
                {/* DRAFT copy, final in 3.2 */}
                <div className={cn(text, 'lg:self-end')}>
                    <p className="text-smoke font-mono text-xs tracking-wider uppercase">
                        ECU · TCU · Custom calibration
                    </p>
                    <h1
                        id="hero-title"
                        className="mt-4 text-4xl leading-[0.95] font-extrabold text-balance uppercase italic sm:text-5xl lg:text-6xl xl:text-7xl"
                    >
                        Calibrated in the workshop. Proven on the clock.
                    </h1>
                </div>

                {run && metric && (
                    <Timeslip
                        run={run}
                        metric={metric}
                        className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:self-center"
                    />
                )}

                <div className={cn(text, 'lg:self-start')}>
                    <p className="text-smoke max-w-xl text-lg">
                        ECU and TCU calibration, done in our workshop or as a
                        file service for tuners. Every gain we show is timed on
                        a Dragy, stock against tuned.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-4">
                        <a
                            href="#contact"
                            className="bg-gtech-red hover:bg-gtech-red/85 inline-flex min-h-12 -skew-x-12 items-center px-6 font-semibold text-white uppercase transition-colors"
                        >
                            <span className="skew-x-12">Book your car</span>
                        </a>
                        <Link
                            href={register()}
                            className="border-line hover:border-chalk inline-flex min-h-12 items-center border px-6 font-semibold uppercase transition-colors"
                        >
                            File service for tuners
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Timeslip({
    run,
    metric,
    className,
}: {
    run: DragyRun;
    metric: Metric;
    className: string;
}) {
    const { stock, tuned } = metric;
    const isQuick = metric.label === '100–200 km/h';

    return (
        <div
            role="group"
            aria-label="Featured Dragy run"
            className={cn(
                'bg-asphalt-raised border-line border p-5 sm:p-6',
                className,
            )}
        >
            <div className="text-smoke flex justify-between gap-4 font-mono text-xs uppercase">
                <span>Dragy · {metric.label}</span>
                <time dateTime={run.recorded_on}>{run.recorded_on}</time>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-xl font-semibold">{run.vehicle}</p>
                <span className="bg-chalk text-ink inline-block -skew-x-12 px-2 py-0.5 font-mono text-xs font-semibold uppercase">
                    <span className="inline-block skew-x-12">{run.stage}</span>
                </span>
            </div>

            <dl className="mt-6 grid gap-3">
                <Lane label="Stock" time={stock} bar="bg-smoke" />
                <Lane label="GTECH" time={tuned} bar="bg-gtech-red" />
            </dl>

            <p
                className="animate-in fade-in fill-mode-backwards mt-6 flex flex-wrap items-baseline gap-x-3 duration-300 motion-reduce:animate-none"
                style={{ animationDelay: `${stock * REPLAY}s` }}
            >
                <span className="text-gtech-red text-5xl font-extrabold italic sm:text-6xl">
                    −{formatTime(deltaSeconds(stock, tuned))} s
                </span>
                <span className="text-signal font-mono text-sm uppercase">
                    {percentQuicker(stock, tuned).toFixed(1)}% quicker
                </span>
            </p>

            {isQuick &&
                run.stock_quarter_mile !== null &&
                run.tuned_quarter_mile !== null && (
                    <p className="text-smoke border-line mt-5 border-t pt-4 font-mono text-xs uppercase">
                        1/4 mile {formatTime(run.stock_quarter_mile)} →{' '}
                        {formatTime(run.tuned_quarter_mile)} s
                        {run.tuned_trap_speed !== null &&
                            ` · ${run.tuned_trap_speed} km/h`}
                    </p>
                )}

            {run.proof_url && (
                <a
                    href={run.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-signal hover:text-chalk mt-2 inline-flex min-h-11 items-center font-mono text-sm uppercase transition-colors"
                >
                    View proof <span aria-hidden="true">&nbsp;↗</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                </a>
            )}
        </div>
    );
}

// The bar fills in time × REPLAY; its printed time carries the meaning.
function Lane({
    label,
    time,
    bar,
}: {
    label: string;
    time: number;
    bar: string;
}) {
    return (
        <div className="grid grid-cols-[4rem_1fr] items-center gap-3">
            <dt className="text-smoke font-mono text-xs uppercase">{label}</dt>
            <dd className="flex items-center gap-3">
                <div
                    aria-hidden="true"
                    className="bg-line h-5 flex-1 overflow-hidden"
                >
                    <div
                        className="animate-in slide-in-from-left h-full ease-linear motion-reduce:animate-none"
                        style={{ animationDuration: `${time * REPLAY}s` }}
                    >
                        {/* Start clipped, finish kept inside: only the slanted end shows. */}
                        <div
                            className={cn('mr-2 -ml-2 h-full -skew-x-12', bar)}
                        />
                    </div>
                </div>
                <span className="font-mono text-sm tabular-nums">
                    {formatTime(time)} s
                </span>
            </dd>
        </div>
    );
}

import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { HeroCar } from '@/components/home/hero-car';
import type { CarModel } from '@/components/home/hero-car-scene';
import { deltaSeconds, formatTime, percentQuicker } from '@/lib/dragy';
import { cn } from '@/lib/utils';
import type { DragyRun } from '@/types/dragy';

// The carousel, in turn: each car's run in the fixture, its model (all
// credited elsewhere) and its heading, two lines.
const CARS: {
    vehicle: string;
    model: CarModel;
    lines: [string, string];
    // A long heading is set a step smaller, to stand as tall as the others.
    long?: boolean;
}[] = [
    {
        vehicle: 'Porsche 911 Turbo S',
        lines: ['Calibrated in the workshop.', 'Proven on the clock.'],
        // n.brizitskaya's Porsche 911 (CC BY 4.0), badged Turbo S.
        model: {
            src: '/models/porsche_911.glb',
            length: 4.54,
            yaw: 0,
            lamps: /^headlights_flash$/,
            paint: 'body_main',
            color: '#de2125',
            door: { open: 'door_2', shut: 'door_1' },
        },
    },
    {
        vehicle: 'BMW M340i xDrive (G20)',
        lines: [
            'ECU and TCU calibration for performance vehicles and professional tuners.',
            'Developed through data, validated on the road.',
        ],
        long: true,
        // KOElkast1007's BMW G20 330i Facelift (Sketchfab Standard), in its
        // own red. A game rig: the lamps are found by material.
        model: {
            src: '/models/bmw_g20_330i.glb',
            length: 4.71,
            yaw: -Math.PI / 2,
            lamps: /^3erg20_lights1\.001$/,
            paint: '3erg20_paint',
        },
    },
    {
        vehicle: 'Cupra Formentor VZ5',
        lines: [
            'Proof over promise.',
            'Stock against tuned, timed on a Dragy.',
        ],
        // KOElkast1007's Cupra Formentor (Sketchfab Standard), in its own paint.
        model: {
            src: '/models/cupra_formentor.glb',
            length: 4.45,
            yaw: Math.PI / 2,
            lamps: /^formentor_(lowhigh|high)_F$/,
            paint: 'formentor_paint',
        },
    },
];
const MODELS = CARS.map((car) => car.model);

// Exponential ease-out: slides land softly.
const ENTER =
    'animate-in fade-in duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none';

type Props = {
    runs: DragyRun[];
};

// The race replay: lanes fill at this fraction of the real run time.
const REPLAY = 0.35;

type Metric = { label: string; stock: number; tuned: number };

// 100–200 when the run has it, 1/4 mile otherwise.
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
    // `step` is the way it last turned: the new slide comes in from that side.
    const [{ index, step }, setSlide] = useState({ index: 0, step: 1 });
    const run = runs.find((each) => each.vehicle === CARS[index].vehicle);
    const metric = run && mainMetric(run);
    const from = step > 0 ? 'slide-in-from-right-8' : 'slide-in-from-left-8';
    const turn = (by: number) =>
        setSlide((slide) => ({
            index: (slide.index + by + CARS.length) % CARS.length,
            step: by,
        }));

    return (
        <section
            aria-labelledby="hero-title"
            className="border-line relative isolate overflow-hidden border-b"
        >
            {/* Phones: the car above the text. Wide screens: the car behind it, on the right. */}
            <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 -z-10 h-[46svh] mask-b-from-55% lg:inset-y-0 lg:h-auto lg:mask-b-from-65%"
            >
                <HeroCar models={MODELS} index={index} step={step} />
            </div>

            <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-[38svh] pb-10 lg:min-h-[40rem] lg:justify-between lg:gap-12 lg:px-8 lg:py-12">
                {/* DRAFT copy, final in 3.2 */}
                {/* Every heading in one cell, the hidden ones holding their
                    height: the run and the arrows never move as they change.
                    Each slides in again as its car comes up. */}
                <h1
                    id="hero-title"
                    className="grid font-extrabold text-balance uppercase italic lg:max-w-2xl"
                >
                    {CARS.map((car, i) => (
                        <span
                            key={car.vehicle}
                            className={cn(
                                'col-start-1 row-start-1',
                                car.long
                                    ? 'max-w-xl text-[1.75rem] leading-[1.05] sm:text-[2.125rem] xl:text-[2.5rem]'
                                    : 'text-[2.625rem] leading-[0.95] sm:text-[3.375rem] xl:text-[4.125rem]',
                                i !== index && 'invisible',
                            )}
                        >
                            {car.lines.map((line, n) => (
                                <span
                                    key={line}
                                    className={cn(
                                        'block',
                                        i === index && [
                                            n > 0 &&
                                                'fill-mode-backwards delay-150',
                                            ENTER,
                                            from,
                                        ],
                                    )}
                                >
                                    {n > 0 && ' '}
                                    {line}
                                </span>
                            ))}
                        </span>
                    ))}
                </h1>

                <div>
                    {/* Announces the next run; the replay restarts with it. */}
                    <div aria-live="polite">
                        {run && metric && (
                            <Timeslip
                                key={index}
                                run={run}
                                metric={metric}
                                className={cn(ENTER, from)}
                            />
                        )}
                    </div>

                    <div className="mt-10 flex gap-2 sm:mt-6">
                        <button
                            type="button"
                            onClick={() => turn(-1)}
                            aria-label="Previous car"
                            className={ARROW}
                        >
                            <ArrowLeft aria-hidden="true" className="size-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => turn(1)}
                            aria-label="Next car"
                            className={ARROW}
                        >
                            <ArrowRight aria-hidden="true" className="size-5" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

const ARROW =
    'border-line text-chalk hover:border-chalk inline-flex size-11 items-center justify-center border transition-colors';

// The car's run as a drag strip: both lanes run at the clock's pace, so the
// tuned one stops first and shorter, and the Δ lands once the stock lane is home.
function Timeslip({
    run,
    metric,
    className,
}: {
    run: DragyRun;
    metric: Metric;
    className?: string;
}) {
    const { stock, tuned } = metric;
    const longest = Math.max(stock, tuned);
    const lanes = [
        { label: 'Stock', time: stock, text: 'text-smoke', bar: 'bg-smoke/50' },
        {
            label: 'GTECH',
            time: tuned,
            text: 'text-chalk font-semibold',
            bar: 'bg-gtech-red',
        },
    ];
    const trap =
        run.tuned_trap_speed !== null
            ? `trap ${run.tuned_trap_speed} km/h`
            : null;

    return (
        <div role="group" aria-label="Dragy run" className={className}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-lg font-semibold lg:text-xl">
                    {run.vehicle}
                </p>
                <span className="bg-chalk text-ink inline-block -skew-x-12 px-2 py-0.5 font-mono text-xs font-semibold uppercase">
                    <span className="inline-block skew-x-12">{run.stage}</span>
                </span>
            </div>

            <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-x-8">
                <ul>
                    {lanes.map((lane) => (
                        <li
                            key={lane.label}
                            className={cn(
                                'grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 py-2 font-mono lg:grid-cols-[4.5rem_minmax(0,1fr)] lg:gap-6',
                                lane.text,
                            )}
                        >
                            <span className="text-sm uppercase lg:text-base">
                                {lane.label}
                            </span>
                            {/* Length ∝ time, filled in time × REPLAY. The right padding keeps room for the time at the bar's end. */}
                            <div className="h-8 overflow-hidden pr-24 lg:h-10 lg:pr-32">
                                <div
                                    className="animate-in slide-in-from-left relative h-full ease-linear motion-reduce:animate-none"
                                    style={{
                                        width: `${(lane.time / longest) * 100}%`,
                                        animationDuration: `${lane.time * REPLAY}s`,
                                    }}
                                >
                                    {/* Start clipped, finish kept inside: only the slanted end shows. */}
                                    <div
                                        aria-hidden="true"
                                        className={cn(
                                            'mr-2 -ml-2 h-full -skew-x-12',
                                            lane.bar,
                                        )}
                                    />
                                    {/* Printed once the lane crosses the line. */}
                                    <span
                                        className="animate-in fade-in fill-mode-backwards absolute inset-y-0 left-full ml-1 flex items-center text-lg whitespace-nowrap tabular-nums motion-reduce:animate-none lg:text-2xl"
                                        style={{
                                            animationDelay: `${lane.time * REPLAY}s`,
                                        }}
                                    >
                                        {formatTime(lane.time)} s
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>

                <p
                    className={cn(
                        ENTER,
                        'slide-in-from-bottom-2 fill-mode-backwards mt-3 text-right duration-400 lg:mt-0',
                    )}
                    style={{ animationDelay: `${stock * REPLAY}s` }}
                >
                    <span className="text-gtech-red block text-7xl leading-[0.8] font-extrabold italic xl:text-8xl">
                        −{formatTime(deltaSeconds(stock, tuned))}
                        <span className="text-[0.5em]"> s</span>
                    </span>
                    <span className="text-signal mt-2 block font-mono text-sm uppercase">
                        {percentQuicker(stock, tuned).toFixed(1)}% quicker
                    </span>
                </p>
            </div>

            <div className="text-smoke mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 font-mono text-xs uppercase">
                <div className="space-y-1">
                    {metric.label === '100–200 km/h' &&
                    run.stock_quarter_mile !== null &&
                    run.tuned_quarter_mile !== null ? (
                        <p>
                            1/4 mile {formatTime(run.stock_quarter_mile)}{' '}
                            <ArrowRight
                                aria-hidden="true"
                                className="inline size-3"
                            />
                            <span className="sr-only">to</span>{' '}
                            {formatTime(run.tuned_quarter_mile)} s
                            {trap && ` · ${trap}`}
                        </p>
                    ) : (
                        trap && <p>{trap}</p>
                    )}
                    {/* Goes with the fixture in 2.3. */}
                    <p>Sample data — not real runs</p>
                </div>
                {run.proof_url && (
                    <a
                        href={run.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-gtech-red bg-gtech-red/10 text-chalk hover:bg-gtech-red/25 inline-flex min-h-11 items-center gap-2 border px-4 text-sm transition-colors"
                    >
                        View proof
                        <ArrowUpRight aria-hidden="true" className="size-4" />
                        <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                )}
            </div>
        </div>
    );
}

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRef } from 'react';

// The four confirmed services, and no others. No prices or turnaround times.
// `stages` render as the skewed stage badges the Timeslip uses; `specifics`
// as square tags.
const SERVICES: {
    title: string;
    body: string;
    stages?: string[];
    specifics?: string[];
}[] = [
    {
        title: 'ECU remap', // DRAFT
        body: 'Your engine’s rulebook, rewritten for the hardware you actually run. Pick the stage that matches your build.', // DRAFT
        stages: ['Stage 1', 'Stage 2', 'Stage 3'],
    },
    {
        title: 'TCU / gearbox tuning', // DRAFT
        body: 'More torque is only half the job. The gearbox gets its own calibration, so every shift keeps up.', // DRAFT
        specifics: ['Transmission control unit'], // DRAFT
    },
    {
        title: 'Custom calibration', // DRAFT
        body: 'No off-the-shelf file. A calibration written for your car and your brief, starting from a blank map.', // DRAFT
        specifics: ['Your hardware', 'Your brief'], // DRAFT
    },
    {
        title: 'Tuning features', // DRAFT
        body: 'The details you feel from the driver’s seat, added to the calibration on their own or with a remap.', // DRAFT
        specifics: [
            'Launch control',
            'Pops & bangs',
            'Speed limiter removal',
            'Map switching',
        ],
    },
];

const ARROW =
    'border-line text-chalk hover:border-chalk inline-flex size-11 items-center justify-center border transition-colors';

export function Services() {
    const track = useRef<HTMLDivElement>(null);

    // One card per press; the snap points settle it.
    const slide = (by: number) => {
        const el = track.current;
        const card = el?.querySelector('li');

        if (!el || !card) {
            return;
        }

        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollBy({
            left: by * card.offsetWidth,
            behavior: reduce ? 'auto' : 'smooth',
        });
    };

    return (
        <section
            id="services"
            aria-labelledby="services-title"
            className="border-line border-b py-24"
        >
            <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end lg:gap-16 lg:px-8">
                <h2
                    id="services-title"
                    className="reveal-slant text-5xl leading-[0.9] font-extrabold text-balance uppercase italic lg:text-7xl"
                >
                    What we calibrate {/* DRAFT */}
                </h2>
                <div className="reveal flex flex-col gap-6">
                    <p className="text-smoke text-lg">
                        {/* DRAFT */}
                        Engine and gearbox calibration, from a Stage 1 remap to
                        a calibration built from scratch.
                    </p>
                    {/* Phones swipe; the buttons are for mouse users. */}
                    <div className="hidden gap-2 sm:flex">
                        <button
                            type="button"
                            onClick={() => slide(-1)}
                            aria-label="Previous service"
                            className={ARROW}
                        >
                            <ArrowLeft aria-hidden="true" className="size-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => slide(1)}
                            aria-label="Next service"
                            className={ARROW}
                        >
                            <ArrowRight aria-hidden="true" className="size-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/*
             * Full-bleed track: it starts on the content edge and runs off the
             * right of the screen. The gutter matches max-w-7xl plus its padding.
             */}
            <div
                ref={track}
                role="region"
                aria-labelledby="services-title"
                tabIndex={0}
                className="reveal mt-12 snap-x snap-mandatory scroll-px-(--gutter) [scrollbar-width:none] overflow-x-auto overscroll-x-contain px-(--gutter) [--gutter:1rem] lg:mt-16 lg:[--gutter:max(2rem,calc((100%-80rem)/2+2rem))]"
            >
                {/* The 1px gap over the line colour draws the hairlines. */}
                <ol className="border-line bg-line flex w-max gap-px border">
                    {SERVICES.map((service, i) => (
                        <li
                            key={service.title}
                            className="slide-in bg-asphalt flex w-[80vw] snap-start flex-col p-6 sm:w-[26rem] sm:p-8 lg:w-[28rem] lg:p-10"
                        >
                            <span
                                aria-hidden="true"
                                className="text-gtech-red text-2xl leading-none font-extrabold italic"
                            >
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <h3 className="mt-6 text-3xl leading-none font-extrabold text-balance uppercase italic lg:text-4xl">
                                {service.title}
                            </h3>
                            <p className="text-smoke mt-6 text-lg">
                                {service.body}
                            </p>

                            <div className="mt-auto pt-10">
                                {service.stages && (
                                    <ul className="flex flex-wrap gap-3">
                                        {service.stages.map((stage) => (
                                            <li
                                                key={stage}
                                                className="bg-chalk text-ink inline-block -skew-x-12 px-3 py-1 font-mono text-sm font-semibold"
                                            >
                                                <span className="inline-block skew-x-12">
                                                    {stage}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {service.specifics && (
                                    <ul className="flex flex-wrap gap-2">
                                        {service.specifics.map((item) => (
                                            <li
                                                key={item}
                                                className="border-line border px-3 py-1.5 font-mono text-sm"
                                            >
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}

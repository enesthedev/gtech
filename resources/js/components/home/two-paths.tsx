import { Link } from '@inertiajs/react';
import type { CSSProperties, ReactNode } from 'react';
import { dealers, register } from '@/routes';

const DEALER_STEPS = [
    'Find your nearest GTECH dealer.', // DRAFT
    'Book your car in with them.', // DRAFT
    'Your car is read, calibrated and tested.', // DRAFT
    'Collect your car.', // DRAFT
];

const FILE_STEPS = [
    'Create a tuner account.', // DRAFT
    'Send your original read with the vehicle details.', // DRAFT
    'We calibrate the file to your brief.', // DRAFT
    'Download the calibrated file.', // DRAFT
];

const ctaClass =
    'inline-flex min-h-11 -skew-x-12 items-center px-5 text-sm font-semibold uppercase transition-colors';

// On wide screens both paths share one grid: row 1 the headings, rows 2–5 the
// steps, row 6 the CTAs. Step N sits in the same row on both sides, so the
// full-width hairlines and the slanted rule between them always meet.
const STEP_ROWS = [
    'lg:row-start-2',
    'lg:row-start-3',
    'lg:row-start-4',
    'lg:row-start-5',
];

type PathProps = {
    audience: string;
    title: string;
    steps: string[];
    // Grid column on wide screens, and the right-hand path trails the left.
    side: 'left' | 'right';
    children: ReactNode;
};

function Path({ audience, title, steps, side, children }: PathProps) {
    const col = side === 'left' ? 'lg:col-start-1' : 'lg:col-start-3';
    const lag = { '--i': side === 'left' ? 0 : 1 } as CSSProperties;

    return (
        <>
            <h3 className={`reveal pb-8 lg:row-start-1 ${col}`} style={lag}>
                <span className="text-signal block text-lg font-semibold">
                    {audience}
                </span>
                <span className="mt-3 block text-3xl leading-none font-extrabold text-balance uppercase italic lg:text-4xl">
                    {title}
                </span>
            </h3>
            {/* `contents` lets each step sit in the shared grid rows. */}
            <ol className="contents">
                {steps.map((step, i) => (
                    <li
                        key={step}
                        className={`reveal border-line grid grid-cols-[3rem_minmax(0,1fr)] items-baseline gap-4 border-t py-5 lg:border-t-0 ${col} ${STEP_ROWS[i]}`}
                        style={lag}
                    >
                        <span
                            aria-hidden="true"
                            className="text-gtech-red text-3xl leading-none font-extrabold italic"
                        >
                            {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-lg">{step}</span>
                    </li>
                ))}
            </ol>
            <div
                className={`border-line border-t pt-8 lg:row-start-6 lg:border-t-0 ${col}`}
            >
                {children}
            </div>
        </>
    );
}

export function TwoPaths() {
    return (
        <section
            id="how-it-works"
            aria-labelledby="how-it-works-title"
            className="border-line border-b"
        >
            <div className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end lg:gap-16">
                    <h2
                        id="how-it-works-title"
                        className="reveal-slant text-5xl leading-[0.9] font-extrabold text-balance uppercase italic lg:text-7xl"
                    >
                        Two ways in {/* DRAFT */}
                    </h2>
                    <p className="reveal text-smoke text-lg">
                        {/* DRAFT */}
                        Car owners book in through a GTECH dealer. Tuners send
                        us their files.
                    </p>
                </div>

                <div className="mt-12 grid lg:mt-16 lg:grid-cols-[minmax(0,1fr)_6rem_minmax(0,1fr)]">
                    {/* Wide screens: one hairline per step row, straight across the gutter. */}
                    {STEP_ROWS.map((row, i) => (
                        <div
                            key={row}
                            aria-hidden="true"
                            className={`border-line hidden border-t lg:col-span-full lg:block ${row} ${i === STEP_ROWS.length - 1 ? 'border-b' : ''}`}
                        />
                    ))}

                    <Path
                        audience="For car owners" // DRAFT
                        title="Through a dealer" // DRAFT
                        steps={DEALER_STEPS}
                        side="left"
                    >
                        <Link
                            href={dealers()}
                            className={`${ctaClass} bg-gtech-red hover:bg-gtech-red/85 text-white`}
                        >
                            {/* DRAFT */}
                            <span className="skew-x-12">Find a dealer</span>
                        </Link>
                    </Path>

                    {/*
                     * The page's one slanted rule: flat between the stacked
                     * paths, then from the first step hairline to the last.
                     * It skews about its centre; `draw` scales the inner line.
                     * ponytail: the gutter holds the slant for step rows up to
                     * ~450px tall in total; widen the gutter if copy grows.
                     */}
                    <div
                        aria-hidden="true"
                        className="my-12 h-px lg:col-start-2 lg:row-span-4 lg:row-start-2 lg:my-0 lg:h-auto lg:w-px lg:-skew-x-12 lg:justify-self-center"
                    >
                        <div className="draw bg-line size-full" />
                    </div>

                    <Path
                        audience="For tuners" // DRAFT
                        title="File service" // DRAFT
                        steps={FILE_STEPS}
                        side="right"
                    >
                        <Link
                            href={register()}
                            className={`${ctaClass} border-chalk hover:bg-chalk hover:text-asphalt border`}
                        >
                            {/* DRAFT */}
                            <span className="skew-x-12">
                                Register for file service
                            </span>
                        </Link>
                    </Path>
                </div>
            </div>
        </section>
    );
}

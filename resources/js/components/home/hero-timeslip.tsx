import { pickFeatured } from '@/lib/dragy';
import type { DragyRun } from '@/types/dragy';

type Props = {
    runs: DragyRun[];
};

// Placeholder: 1.3 builds the hero and the Timeslip panel.
export function HeroTimeslip({ runs }: Props) {
    const featured = pickFeatured(runs);

    return (
        <section aria-labelledby="hero-title" className="border-line border-b">
            <div className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
                <h1
                    id="hero-title"
                    className="text-smoke font-mono text-sm uppercase"
                >
                    Hero — 1.3
                </h1>
                <p className="text-smoke mt-2 font-mono text-sm">
                    Featured: {featured?.vehicle ?? 'none'}
                </p>
            </div>
        </section>
    );
}

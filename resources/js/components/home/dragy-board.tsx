import type { DragyRun } from '@/types/dragy';

type Props = {
    runs: DragyRun[];
};

// Placeholder: 1.4 builds the Dragy board.
export function DragyBoard({ runs }: Props) {
    if (runs.length === 0) {
        return null;
    }

    return (
        <section
            id="dragy"
            aria-labelledby="dragy-title"
            className="border-line border-b"
        >
            <div className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
                <h2
                    id="dragy-title"
                    className="text-smoke font-mono text-sm uppercase"
                >
                    Dragy runs — 1.4
                </h2>
                <p className="text-smoke mt-2 font-mono text-sm">
                    {runs.length} sample runs
                </p>
            </div>
        </section>
    );
}

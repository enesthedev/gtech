import { useEffect, useRef, useState } from 'react';
import { preload } from 'react-dom';
import type { CarModel, mountScene } from '@/components/home/hero-car-scene';
import { cn } from '@/lib/utils';

type Props = {
    models: CarModel[];
    // The one on the start line.
    index: number;
    // The way it last turned: the car fades in from that side.
    step: number;
};

// A shift light for the download: the last segments are the red line.
const SEGMENTS = 12;
const REDLINE = 9;

// Decorative: the run beside it carries the proof. three.js and the first
// model load once the page has painted, side by side.
export function HeroCar({ models, index, step }: Props) {
    const ref = useRef<HTMLCanvasElement>(null);
    const stage = useRef<ReturnType<typeof mountScene>>(undefined);
    // Read once the scene is in, should the index change while it loads.
    const wanted = useRef(index);
    // How much of the car on its way has arrived; null once it stands on
    // the line.
    const [loading, setLoading] = useState<number | null>(0);

    useEffect(() => {
        wanted.current = index;
        stage.current?.go(index, step);
    }, [index, step]);

    useEffect(() => {
        const canvas = ref.current;

        if (!canvas) {
            return;
        }

        let cancelled = false;
        // Downloading while three.js does: the loader's fetch takes it over.
        preload(models[wanted.current].src, {
            as: 'fetch',
            crossOrigin: 'anonymous',
        });
        import('@/components/home/hero-car-scene')
            .then(({ mountScene }) => {
                if (!cancelled) {
                    stage.current = mountScene(
                        canvas,
                        models,
                        wanted.current,
                        setLoading,
                    );
                }
            })
            .catch(() => setLoading(null));

        return () => {
            cancelled = true;
            stage.current?.unmount();
            stage.current = undefined;
        };
    }, [models]);

    const lit = Math.floor((loading ?? 0) * SEGMENTS);
    // Downloaded; the car is being decoded and lit. The light flashes like
    // it does at the limiter.
    const limiter = loading === 1;

    return (
        <>
            <canvas ref={ref} className="block size-full opacity-0" />
            {/* Where the car will stand: centre on phones, right of the text on wide screens. */}
            {loading !== null && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:top-[38%] lg:left-[72%]">
                    <p className="flex justify-between gap-4 font-mono text-xs uppercase">
                        <span className="text-smoke">Loading 3D</span>
                        <span className="text-chalk tabular-nums">
                            {Math.round(loading * 100)}%
                        </span>
                    </p>
                    <div
                        className={cn(
                            'mt-2 flex gap-1',
                            limiter &&
                                'animate-pulse motion-reduce:animate-none',
                        )}
                        style={{ animationDuration: '0.5s' }}
                    >
                        {Array.from({ length: SEGMENTS }, (_, i) => (
                            <span
                                key={i}
                                className={cn(
                                    'h-4 w-2.5 -skew-x-12 transition-colors',
                                    i >= lit
                                        ? 'bg-line'
                                        : i >= REDLINE
                                          ? 'bg-gtech-red'
                                          : 'bg-chalk',
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

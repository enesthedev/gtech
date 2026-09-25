import { Link } from '@inertiajs/react';
import { ArrowRight, Menu } from 'lucide-react';
import { useEffect, useRef } from 'react';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn, toUrl } from '@/lib/utils';
import { home, login } from '@/routes';
import type { NavItem } from '@/types';

type Props = {
    nav: NavItem[];
};

// Drag-tree staging: each lamp lights this long after the hover starts.
const LAMPS = [200, 290, 380];

export function SiteHeader({ nav }: Props) {
    const headerRef = useRef<HTMLElement>(null);

    // The red lane under the header fills with page scroll (--p, 0 → 1).
    useEffect(() => {
        const header = headerRef.current;

        if (!header) {
            return;
        }

        let frame = 0;
        const update = () => {
            frame = 0;
            const room =
                document.documentElement.scrollHeight - window.innerHeight;
            header.style.setProperty(
                '--p',
                String(room > 0 ? Math.min(1, scrollY / room) : 0),
            );
        };
        const onScroll = () => {
            frame ||= requestAnimationFrame(update);
        };

        update();
        addEventListener('scroll', onScroll, { passive: true });
        addEventListener('resize', onScroll);

        return () => {
            removeEventListener('scroll', onScroll);
            removeEventListener('resize', onScroll);
            cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <header
            ref={headerRef}
            className="border-line bg-asphalt sticky top-0 z-40 border-b"
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 lg:h-20 lg:gap-10 lg:px-8">
                <Link href={home()} className="shrink-0">
                    <img
                        src="/brand/gtech-logo-light.webp"
                        alt="GTECH Calibration"
                        width={2000}
                        height={515}
                        className="h-7 w-auto lg:h-9"
                    />
                </Link>

                <nav aria-label="Main" className="hidden gap-6 lg:flex">
                    {nav.map((item) => (
                        <a
                            key={item.title}
                            href={toUrl(item.href)}
                            className="text-smoke hover:text-chalk inline-flex min-h-11 items-center text-sm font-semibold transition-colors"
                        >
                            {item.title}
                        </a>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-2 lg:gap-6">
                    <LoginButton />

                    <Sheet>
                        <SheetTrigger asChild>
                            <button
                                type="button"
                                aria-label="Open menu"
                                className="inline-flex size-11 items-center justify-center lg:hidden"
                            >
                                <Menu className="size-6" />
                            </button>
                        </SheetTrigger>
                        {/* The last-child variant grows the built-in close button to a 44px tap target. */}
                        <SheetContent
                            side="right"
                            aria-describedby={undefined}
                            className="dark border-line bg-asphalt text-chalk gap-8 px-6 pt-16 [&>button:last-child]:top-2.5 [&>button:last-child]:right-2.5 [&>button:last-child]:grid [&>button:last-child]:size-11 [&>button:last-child]:place-items-center"
                        >
                            <SheetTitle className="sr-only">Menu</SheetTitle>
                            <nav aria-label="Main" className="flex flex-col">
                                {nav.map((item) => (
                                    <SheetClose asChild key={item.title}>
                                        <a
                                            href={toUrl(item.href)}
                                            className="border-line flex min-h-12 items-center border-b text-lg font-semibold"
                                        >
                                            {item.title}
                                        </a>
                                    </SheetClose>
                                ))}
                            </nav>
                            <LoginButton className="w-full justify-center" />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Scroll progress, the lane over the hairline. Hidden with reduced motion. */}
            <div
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-px h-0.5 origin-left motion-reduce:hidden"
                style={{ transform: 'scaleX(var(--p, 0))' }}
            >
                <div className="bg-gtech-red h-full" />
            </div>
        </header>
    );
}

// Into the tuning dashboard. On hover or focus a chalk lane sweeps in behind
// the label, then the staging lamps light red in turn, like a drag tree.
// Reduced motion: no transitions, the lit state simply appears.
function LoginButton({ className }: { className?: string }) {
    return (
        <Link
            href={login()}
            className={cn(
                'group/login bg-gtech-red relative inline-flex h-11 -skew-x-12 items-center overflow-hidden px-4 text-sm font-extrabold tracking-wide uppercase italic lg:px-5',
                className,
            )}
        >
            <span
                aria-hidden="true"
                className="bg-chalk absolute inset-0 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover/login:scale-x-100 group-focus-visible/login:scale-x-100 motion-reduce:transition-none"
            />
            <span className="group-hover/login:text-ink group-focus-visible/login:text-ink relative flex skew-x-12 items-center gap-2 text-white">
                <span aria-hidden="true" className="flex gap-1">
                    {LAMPS.map((delay) => (
                        <span
                            key={delay}
                            className="group-hover/login:bg-gtech-red group-focus-visible/login:bg-gtech-red size-1 bg-white/40 transition-colors motion-reduce:transition-none"
                            style={{ transitionDelay: `${delay}ms` }}
                        />
                    ))}
                </span>
                <span className="whitespace-nowrap">
                    Let&rsquo;s tune
                    <span className="sr-only"> (log in)</span>
                </span>
                <ArrowRight
                    aria-hidden="true"
                    className="hidden size-3.5 transition-transform group-hover/login:translate-x-1 group-focus-visible/login:translate-x-1 motion-reduce:transition-none lg:block"
                />
            </span>
        </Link>
    );
}

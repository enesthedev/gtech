import { Link } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { toUrl } from '@/lib/utils';
import { home, login } from '@/routes';
import type { NavItem } from '@/types';

type Props = {
    nav: NavItem[];
};

const bookClass =
    'inline-flex min-h-11 -skew-x-12 items-center bg-gtech-red px-4 text-sm font-semibold text-white uppercase transition-colors hover:bg-gtech-red/85 lg:px-5';

export function SiteHeader({ nav }: Props) {
    return (
        <header className="border-line border-b">
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
                    <Link
                        href={login()}
                        className="text-smoke hover:text-chalk hidden min-h-11 items-center text-sm font-semibold transition-colors lg:inline-flex"
                    >
                        Tuner login
                    </Link>

                    <a href="#contact" className={bookClass}>
                        <span className="skew-x-12">Book your car</span>
                    </a>

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
                            <Link
                                href={login()}
                                className="text-smoke inline-flex min-h-11 items-center font-semibold"
                            >
                                Tuner login
                            </Link>
                            <SheetClose asChild>
                                <a
                                    href="#contact"
                                    className={`${bookClass} self-start`}
                                >
                                    <span className="skew-x-12">
                                        Book your car
                                    </span>
                                </a>
                            </SheetClose>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}

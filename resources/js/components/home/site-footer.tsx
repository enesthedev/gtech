import { toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

type Props = {
    nav: NavItem[];
};

export function SiteFooter({ nav }: Props) {
    return (
        <footer className="border-line border-t">
            <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <img
                    src="/brand/gtech-logo-light.webp"
                    alt="GTECH Calibration"
                    width={2000}
                    height={515}
                    className="h-7 w-auto self-start lg:self-auto"
                />
                <nav aria-label="Footer" className="flex flex-wrap gap-x-6">
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
                <p className="text-smoke font-mono text-xs">
                    © {new Date().getFullYear()} GTECH Calibration
                </p>
            </div>
        </footer>
    );
}

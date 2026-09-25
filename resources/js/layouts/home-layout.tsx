import { Head } from '@inertiajs/react';
import { useLayoutEffect } from 'react';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeader } from '@/components/home/site-header';
import type { NavItem } from '@/types';

// Rooted at `/` so the links also work from the other public pages.
export const homeNav: NavItem[] = [
    { title: 'Services', href: '/#services' },
    { title: 'Dragy runs', href: '/#dragy' },
    { title: 'How it works', href: '/#how-it-works' },
    { title: 'Contact', href: '/#contact' },
];

type Props = {
    title: string;
    nav?: NavItem[];
    children: ReactNode;
};

// The public site: always dark, with the home header and footer.
export default function HomeLayout({ title, nav = homeNav, children }: Props) {
    // Always dark, whatever the appearance setting. `home` on <html> gives the
    // asphalt overscroll, dark scrollbars and chalk focus rings (app.blade.php,
    // app.css); the server sets it on first load, this covers Inertia visits.
    useLayoutEffect(() => {
        document.documentElement.classList.add('home');

        return () => document.documentElement.classList.remove('home');
    }, []);

    return (
        <div className="dark bg-asphalt text-chalk min-h-svh">
            <Head title={title} />
            <a
                href="#main"
                className="focus:bg-chalk focus:text-asphalt sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-3 focus:font-semibold"
            >
                Skip to content
            </a>
            <SiteHeader nav={nav} />
            <main id="main">{children}</main>
            <SiteFooter nav={nav} />
        </div>
    );
}

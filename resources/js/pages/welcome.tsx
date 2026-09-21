import { Head } from '@inertiajs/react';
import { useLayoutEffect } from 'react';
import { ContactSection } from '@/components/home/contact-section';
import { DragyBoard } from '@/components/home/dragy-board';
import { HeroTimeslip } from '@/components/home/hero-timeslip';
import { Services } from '@/components/home/services';
import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeader } from '@/components/home/site-header';
import { TwoPaths } from '@/components/home/two-paths';
import { sampleDragyRuns } from '@/data/sample-dragy-runs';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
    { title: 'Services', href: '#services' },
    { title: 'Dragy runs', href: '#dragy' },
    { title: 'How it works', href: '#how-it-works' },
    { title: 'Contact', href: '#contact' },
];

export default function Welcome() {
    const runs = sampleDragyRuns;
    const nav =
        runs.length > 0
            ? navItems
            : navItems.filter((item) => item.href !== '#dragy');

    // Always dark, whatever the appearance setting. `home` on <html> gives the
    // asphalt overscroll, dark scrollbars and chalk focus rings (app.blade.php,
    // app.css); the server sets it on first load, this covers Inertia visits.
    useLayoutEffect(() => {
        document.documentElement.classList.add('home');

        return () => document.documentElement.classList.remove('home');
    }, []);

    return (
        <div className="dark bg-asphalt text-chalk min-h-svh">
            {/* DRAFT copy, final in 3.2 */}
            <Head title="ECU & TCU calibration" />
            <a
                href="#main"
                className="focus:bg-chalk focus:text-asphalt sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-3 focus:font-semibold"
            >
                Skip to content
            </a>
            <SiteHeader nav={nav} />
            <main id="main">
                <HeroTimeslip runs={runs} />
                <DragyBoard runs={runs} />
                <Services />
                <TwoPaths />
                <ContactSection />
            </main>
            <SiteFooter nav={nav} />
        </div>
    );
}

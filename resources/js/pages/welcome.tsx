import { ContactSection } from '@/components/home/contact-section';
import { DragyBoard } from '@/components/home/dragy-board';
import { HeroTimeslip } from '@/components/home/hero-timeslip';
import { Services } from '@/components/home/services';
import { TwoPaths } from '@/components/home/two-paths';
import { sampleDragyRuns } from '@/data/sample-dragy-runs';
import HomeLayout, { homeNav } from '@/layouts/home-layout';

export default function Welcome() {
    const runs = sampleDragyRuns;
    const nav =
        runs.length > 0
            ? homeNav
            : homeNav.filter((item) => item.href !== '/#dragy');

    return (
        // DRAFT copy, final in 3.2
        <HomeLayout title="ECU & TCU calibration" nav={nav}>
            <HeroTimeslip runs={runs} />
            <DragyBoard runs={runs} />
            <Services />
            <TwoPaths />
            <ContactSection />
        </HomeLayout>
    );
}

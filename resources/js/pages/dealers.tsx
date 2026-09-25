import HomeLayout from '@/layouts/home-layout';

// No dealers are listed yet: never invent names or addresses. The list
// replaces the empty state once the owner provides it.
export default function Dealers() {
    return (
        // DRAFT copy, final in 3.2
        <HomeLayout title="Find a dealer">
            <section aria-labelledby="dealers-title">
                <div className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
                    <h1
                        id="dealers-title"
                        className="max-w-3xl text-5xl leading-none font-extrabold text-balance uppercase italic lg:text-7xl"
                    >
                        Find a GTECH dealer {/* DRAFT */}
                    </h1>
                    <p className="text-smoke mt-8 max-w-xl text-lg">
                        {/* DRAFT */}
                        The dealer list is on its way. Until then, tell us where
                        you are and we will put you in touch with a dealer.
                    </p>
                    <a
                        href="/#contact"
                        className="bg-gtech-red hover:bg-gtech-red/85 mt-10 inline-flex min-h-11 -skew-x-12 items-center px-5 text-sm font-semibold text-white uppercase transition-colors"
                    >
                        {/* DRAFT */}
                        <span className="skew-x-12">Contact us</span>
                    </a>
                </div>
            </section>
        </HomeLayout>
    );
}

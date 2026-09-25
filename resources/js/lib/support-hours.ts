import { useEffect, useState } from 'react';

// Support is staffed in business time, whatever the visitor's timezone.
export const TIMEZONE = 'Europe/Istanbul';

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Hours = { open: number; close: number } | null;

// Minutes from midnight, Sunday first. DRAFT — final hours are an owner decision.
export const HOURS: Hours[] = [
    null,
    { open: 9 * 60, close: 18 * 60 },
    { open: 9 * 60, close: 18 * 60 },
    { open: 9 * 60, close: 18 * 60 },
    { open: 9 * 60, close: 18 * 60 },
    { open: 9 * 60, close: 18 * 60 },
    null,
];

const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

function local(now: Date): { day: number; minutes: number } {
    const p = Object.fromEntries(
        parts.formatToParts(now).map(({ type, value }) => [type, value]),
    );

    return {
        day: DAYS.indexOf(p.weekday),
        minutes: Number(p.hour) * 60 + Number(p.minute),
    };
}

export function formatMinutes(minutes: number): string {
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function isOpen(now: Date): boolean {
    const { day, minutes } = local(now);
    const hours = HOURS[day];

    return hours !== null && minutes >= hours.open && minutes < hours.close;
}

// The first opening after now, in business time.
export function nextOpening(now: Date): { day: string; time: string } | null {
    const { day, minutes } = local(now);

    for (let offset = 0; offset <= 7; offset++) {
        const d = (day + offset) % 7;
        const hours = HOURS[d];

        if (hours && (offset > 0 || minutes < hours.open)) {
            return { day: DAYS[d], time: formatMinutes(hours.open) };
        }
    }

    return null;
}

export type SupportStatus = {
    open: boolean;
    next: { day: string; time: string } | null;
};

// Null on the server and the first client render, so SSR never guesses the clock.
export function useSupportStatus(): SupportStatus | null {
    const [status, setStatus] = useState<SupportStatus | null>(null);

    useEffect(() => {
        const update = () => {
            const now = new Date();
            setStatus({ open: isOpen(now), next: nextOpening(now) });
        };

        update();
        const id = setInterval(update, 60_000);

        return () => clearInterval(id);
    }, []);

    return status;
}

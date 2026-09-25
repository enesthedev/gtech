import { expect, test } from 'vite-plus/test';
import { isOpen, nextOpening } from './support-hours';

// Istanbul is UTC+3, so 06:00Z is 09:00 there. 2026-09-22 is a Tuesday.
const at = (iso: string) => new Date(iso);

test('opens and closes on the hour, in Istanbul time', () => {
    expect(isOpen(at('2026-09-22T05:59:00Z'))).toBe(false);
    expect(nextOpening(at('2026-09-22T05:59:00Z'))).toEqual({
        day: 'Tue',
        time: '09:00',
    });
    expect(isOpen(at('2026-09-22T06:00:00Z'))).toBe(true);
    expect(isOpen(at('2026-09-22T14:59:00Z'))).toBe(true);
    expect(isOpen(at('2026-09-22T15:00:00Z'))).toBe(false);
    expect(nextOpening(at('2026-09-22T15:00:00Z'))).toEqual({
        day: 'Wed',
        time: '09:00',
    });
});

test('Friday evening and the weekend wait for Monday', () => {
    expect(nextOpening(at('2026-09-25T15:00:00Z'))).toEqual({
        day: 'Mon',
        time: '09:00',
    });
    expect(isOpen(at('2026-09-26T09:00:00Z'))).toBe(false);
    expect(isOpen(at('2026-09-27T09:00:00Z'))).toBe(false);
    expect(nextOpening(at('2026-09-27T09:00:00Z'))).toEqual({
        day: 'Mon',
        time: '09:00',
    });
});

test('uses the Istanbul day across UTC midnight', () => {
    // Sunday 23:30Z is already Monday 02:30 in Istanbul.
    expect(nextOpening(at('2026-09-27T23:30:00Z'))).toEqual({
        day: 'Mon',
        time: '09:00',
    });
    // Monday 21:30Z is Tuesday 00:30 in Istanbul.
    expect(nextOpening(at('2026-09-28T21:30:00Z'))).toEqual({
        day: 'Tue',
        time: '09:00',
    });
});

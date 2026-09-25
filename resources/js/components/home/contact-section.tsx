import { useState } from 'react';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import {
    DAYS,
    HOURS,
    formatMinutes,
    useSupportStatus,
} from '@/lib/support-hours';
import type { SupportStatus } from '@/lib/support-hours';

// Monday first, the way the week reads.
const WEEK = [1, 2, 3, 4, 5, 6, 0];

const TOPICS = [
    { value: 'workshop', label: 'Workshop' }, // DRAFT
    { value: 'file-service', label: 'File service' }, // DRAFT
    { value: 'other', label: 'Other' }, // DRAFT
];

type Field = 'name' | 'email' | 'vehicle' | 'message';
type Errors = Partial<Record<Field, string>>;

const ctaClass =
    'inline-flex min-h-11 -skew-x-12 items-center px-5 text-sm font-semibold uppercase transition-colors';

const fieldClass =
    'border-line bg-asphalt text-chalk placeholder:text-smoke focus-visible:border-chalk focus-visible:ring-chalk/30 aria-invalid:border-signal rounded-none';

export function ContactSection() {
    const status = useSupportStatus();

    return (
        <section
            id="contact"
            aria-labelledby="contact-title"
            className="bg-gtech-red text-white"
        >
            <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-16 lg:px-8">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col gap-6">
                        <h2
                            id="contact-title"
                            className="reveal-slant text-5xl leading-[0.9] font-extrabold text-balance uppercase italic lg:text-7xl"
                        >
                            Talk to the workshop {/* DRAFT */}
                        </h2>
                        <p className="reveal max-w-md text-lg">
                            {/* DRAFT */}
                            Live chat while we&rsquo;re in. Outside those hours,
                            leave a message and we&rsquo;ll pick it up when we
                            open.
                        </p>
                    </div>

                    <div className="reveal flex flex-col gap-4 font-mono text-sm">
                        <StatusLine status={status} />
                        <table className="w-full max-w-sm">
                            <caption className="sr-only">Support hours</caption>
                            <tbody>
                                {WEEK.map((day) => {
                                    const hours = HOURS[day];

                                    return (
                                        <tr
                                            key={day}
                                            className="border-b border-white/25"
                                        >
                                            <th
                                                scope="row"
                                                className="py-2 text-left font-normal"
                                            >
                                                {DAYS[day]}
                                            </th>
                                            <td className="py-2 text-right">
                                                {hours
                                                    ? `${formatMinutes(hours.open)}–${formatMinutes(hours.close)}`
                                                    : 'Closed'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <p>Istanbul time (TRT, UTC+3)</p>
                    </div>
                </div>

                <div className="bg-ink text-chalk p-6 lg:p-10">
                    {status?.open ? (
                        <ChatEntry />
                    ) : (
                        <OfflineForm status={status} />
                    )}
                </div>
            </div>
        </section>
    );
}

function StatusLine({ status }: { status: SupportStatus | null }) {
    // Unknown until the client has a clock; keeps the line's height.
    if (!status) {
        return <p className="min-h-5" />;
    }

    return (
        <p role="status" className="flex items-center gap-2 font-semibold">
            <span
                aria-hidden="true"
                className={cn(
                    'size-2',
                    status.open ? 'bg-white' : 'border border-white',
                )}
            />
            {status.open
                ? 'Online now'
                : status.next
                  ? `Offline — back ${status.next.day} ${status.next.time}`
                  : 'Offline'}
        </p>
    );
}

function ChatEntry() {
    return (
        <div className="flex h-full flex-col justify-center gap-6">
            <p className="text-2xl font-extrabold uppercase italic">
                We&rsquo;re online {/* DRAFT */}
            </p>
            <p className="text-smoke">
                {/* DRAFT */}
                Ask about a booking, a file or a build. A calibrator answers.
            </p>
            {/* 4.5 opens the chat. */}
            <button
                type="button"
                className={`${ctaClass} bg-gtech-red hover:bg-gtech-red/85 self-start text-white`}
            >
                <span className="skew-x-12">Start live chat {/* DRAFT */}</span>
            </button>
        </div>
    );
}

type FormProps = {
    status: SupportStatus | null;
    // 2.4 feeds these from the Inertia form.
    errors?: Errors;
    submitting?: boolean;
    sent?: boolean;
};

function OfflineForm({
    status,
    errors = {},
    submitting = false,
    sent = false,
}: FormProps) {
    const [topic, setTopic] = useState(TOPICS[0].value);

    if (sent) {
        return (
            <div role="status" className="flex flex-col gap-4">
                <p className="text-2xl font-extrabold uppercase italic">
                    Message received {/* DRAFT */}
                </p>
                <p className="text-smoke">
                    {/* DRAFT */}
                    We&rsquo;re offline right now, so we&rsquo;ll answer when we
                    open
                    {status?.next
                        ? ` — ${status.next.day} ${status.next.time} Istanbul time`
                        : ''}
                    .
                </p>
            </div>
        );
    }

    return (
        // 2.4 posts this form.
        <form
            noValidate
            onSubmit={(e) => e.preventDefault()}
            className="relative flex flex-col gap-6"
        >
            <div className="flex flex-col gap-2">
                <p className="text-2xl font-extrabold uppercase italic">
                    Leave a message {/* DRAFT */}
                </p>
                <p className="text-smoke">
                    {/* DRAFT */}
                    We answer at the next opening.
                </p>
            </div>

            <TextField name="name" label="Name" error={errors.name}>
                {(props) => <Input {...props} autoComplete="name" required />}
            </TextField>
            <TextField name="email" label="Email" error={errors.email}>
                {(props) => (
                    <Input
                        {...props}
                        type="email"
                        autoComplete="email"
                        required
                    />
                )}
            </TextField>

            <div className="flex flex-col gap-2">
                <Label id="topic-label" className="text-smoke">
                    Topic
                </Label>
                <ToggleGroup
                    type="single"
                    aria-labelledby="topic-label"
                    value={topic}
                    // Radix clears on a second click; keep one chosen.
                    onValueChange={(value) => value && setTopic(value)}
                    className="flex-wrap gap-2"
                >
                    {TOPICS.map((t) => (
                        <ToggleGroupItem
                            key={t.value}
                            value={t.value}
                            className="border-line text-smoke hover:text-chalk data-[state=on]:bg-gtech-red h-11 rounded-none border px-4 first:rounded-none last:rounded-none hover:bg-white/5 data-[state=on]:border-transparent data-[state=on]:text-white"
                        >
                            {t.label}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
                <input type="hidden" name="topic" value={topic} />
            </div>

            <TextField
                name="vehicle"
                label="Vehicle"
                optional
                error={errors.vehicle}
            >
                {(props) => (
                    <Input {...props} placeholder="Make, model, year" />
                )}
            </TextField>
            <TextField name="message" label="Message" error={errors.message}>
                {(props) => (
                    <textarea
                        {...props}
                        rows={5}
                        required
                        className={cn(
                            props.className,
                            'border px-3 py-2 text-base outline-none focus-visible:ring-[3px] md:text-sm',
                        )}
                    />
                )}
            </TextField>

            {/* Honeypot: people never see or reach it. */}
            <div aria-hidden="true" className="absolute -left-[9999px]">
                <label htmlFor="contact-website">Website</label>
                <input
                    id="contact-website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                />
            </div>

            <div className="flex flex-col gap-3">
                <button
                    type="submit"
                    disabled={submitting}
                    className={`${ctaClass} bg-gtech-red hover:bg-gtech-red/85 self-start text-white disabled:opacity-70`}
                >
                    <span className="flex skew-x-12 items-center gap-2">
                        {submitting && <Spinner />}
                        {submitting ? 'Sending' : 'Send message'} {/* DRAFT */}
                    </span>
                </button>
                {/* Privacy notice — owner decision. */}
                <p className="text-smoke min-h-5 text-sm" />
            </div>
        </form>
    );
}

// Label above, error below, both tied to the control.
function TextField({
    name,
    label,
    optional,
    error,
    children,
}: {
    name: Field;
    label: string;
    optional?: boolean;
    error?: string;
    children: (props: {
        id: string;
        name: string;
        className: string;
        'aria-invalid'?: boolean;
        'aria-describedby'?: string;
    }) => ReactNode;
}) {
    const id = `contact-${name}`;
    const errorId = `${id}-error`;

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={id} className="text-smoke">
                {label}
                {optional && <span className="font-normal"> (optional)</span>}
            </Label>
            {children({
                id,
                name,
                className: fieldClass,
                'aria-invalid': error ? true : undefined,
                'aria-describedby': error ? errorId : undefined,
            })}
            <InputError id={errorId} message={error} className="text-signal" />
        </div>
    );
}

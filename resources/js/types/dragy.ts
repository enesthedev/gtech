// Mirrors the dragy_runs table (2.2). Times in seconds, speeds in km/h.
export type DragyRun = {
    id: number;
    vehicle: string;
    stage: string;
    mods: string | null;
    stock_100_200: number | null;
    tuned_100_200: number | null;
    stock_quarter_mile: number | null;
    tuned_quarter_mile: number | null;
    stock_trap_speed: number | null;
    tuned_trap_speed: number | null;
    proof_url: string | null;
    recorded_on: string; // Y-m-d
};

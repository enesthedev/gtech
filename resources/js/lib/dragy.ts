export function formatTime(seconds: number): string {
    return seconds.toFixed(2);
}

// Positive when the tuned run is quicker.
export function deltaSeconds(stock: number, tuned: number): number {
    return stock - tuned;
}

export function percentQuicker(stock: number, tuned: number): number {
    return ((stock - tuned) / stock) * 100;
}

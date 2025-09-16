export function getCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;

    const cookies = Object.fromEntries(
        document.cookie.split('; ').map(c => c.split('=') as [string, string])
    );
    return cookies[name] ? decodeURIComponent(cookies[name]) : undefined;
};

export function shuffle(array: any[]) {
    // Fisher-Yates shuffle
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

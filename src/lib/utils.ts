export function getCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;

    const cookies = Object.fromEntries(
        document.cookie.split('; ').map(c => c.split('=') as [string, string])
    );
    return cookies[name] ? decodeURIComponent(cookies[name]) : undefined;
};

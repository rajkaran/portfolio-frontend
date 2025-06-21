export function setItem<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function getItem<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
        return JSON.parse(item) as T;
    } catch {
        return null;
    }
}

export function removeItem(key: string) {
    localStorage.removeItem(key);
}
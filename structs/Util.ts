

export namespace Util {
    export namespace String {
        export function isAlnum(k: string): boolean {
            if (k.length !== 1) return false;
            const c = k.charCodeAt(0);
            return (
                (c >= 48 && c <= 57)  ||   // 0-9
                (c >= 65 && c <= 90)  ||   // A-Z
                (c >= 97 && c <= 122)      // a-z
            );
        }
    }
}
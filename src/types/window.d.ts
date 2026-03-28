export {};

declare global {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Window {
        tokenData?: { tokenId: string; hash: string };
    }
}

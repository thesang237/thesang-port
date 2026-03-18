declare global {
    type Window = {
        workbox?: { register: () => void };
    };
}

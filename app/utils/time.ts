import { createBackoff } from "teslabot";

export const backoff = createBackoff({ onError: (e) => console.warn(e) });
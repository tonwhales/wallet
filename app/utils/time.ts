import { createBackoff } from "teslabot";
import { warn } from "./log";

export const backoff = createBackoff({ onError: (e) => warn(e) });
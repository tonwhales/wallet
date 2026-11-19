export const FLAG_DEFAULTS = {
    flagsPipelineCheck: false,
    ownExchangeSwap: false
} as const;

export type FlagKey = keyof typeof FLAG_DEFAULTS;
export type FlagValueOf<K extends FlagKey> = (typeof FLAG_DEFAULTS)[K] extends boolean ? boolean : string;

export const FLAGS_MAX_AGE_MS = 60 * 60 * 1000;

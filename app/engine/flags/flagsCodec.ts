import { z } from "zod";

export const flagsCodec = z.object({
    flags: z.record(z.union([z.boolean(), z.string()])),
    rev: z.string(),
    ttl: z.number().int().positive()
});

export type FlagsResponse = z.infer<typeof flagsCodec>;

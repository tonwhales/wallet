import axios from "axios";
import { z } from "zod";
import { whalesConnectEndpoint } from "../clients";

const serviceAddressServiceCodec = z.union([z.literal('holders'), z.literal('changelly'), z.literal('postcash')]);

const serviceAddressResponseCodec = z.object({
    ok: z.boolean(),
    found: z.boolean(),
    address: z.string().optional(),
    service: serviceAddressServiceCodec.optional(),
    type: z.string().optional(),
    icon: z.string().optional(),
});

export type ServiceAddressService = z.infer<typeof serviceAddressServiceCodec>;

export type ServiceAddressInfo = {
    found: true;
    address: string;
    service: ServiceAddressService;
    type?: string;
    icon?: string;
} | {
    found: false;
};

/**
 * Checks whether the given address corresponds to a known service and returns its metadata.
 *
 * @param address - The address to check with the service-address API.
 * @returns A `ServiceAddressInfo` object: when `found` is `true` it includes `address`, `service`, and optional `type` and `icon`; when `found` is `false` it indicates no service was found.
 * @throws Error if the HTTP response status is not 200.
 * @throws Error if the response payload does not match the expected schema.
 * @throws Error if the service address check failed (`ok` is falsy in the response).
 */
export async function fetchServiceAddressCheck(address: string): Promise<ServiceAddressInfo> {
    const res = await axios.post(`${whalesConnectEndpoint}/service-address/check`, { address });

    if (res.status !== 200) {
        throw new Error(`Invalid response status: ${res.status} for ${address}`);
    }

    const parsed = serviceAddressResponseCodec.safeParse(res.data);

    if (!parsed.success) {
        throw new Error(`Invalid response data for ${address}`);
    }

    if (!parsed.data.ok) {
        throw new Error(`Service address check failed for ${address}`);
    }

    if (!parsed.data.found) {
        return { found: false };
    }

    return {
        found: true,
        address: parsed.data.address!,
        service: parsed.data.service!,
        type: parsed.data.type,
        icon: parsed.data.icon,
    };
}

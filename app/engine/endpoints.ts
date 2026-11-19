export const WHALES_CONNECT_DEFAULT_ENDPOINT = 'https://connect.tonhubapi.com';
export const whalesConnectOverrideKey = 'whalesConnectEndpointOverride';

export function resolveEndpoint(defaultEndpoint: string, override: string | undefined, allowOverride: boolean): string {
    if (!allowOverride || !override) {
        return defaultEndpoint;
    }
    return /^https?:\/\/[^\s/]+/.test(override) ? override.replace(/\/+$/, '') : defaultEndpoint;
}

import { ConnectRequest } from "@tonconnect/protocol";
import { getAppManifest } from "../getters/getAppManifest";
import { connectRequestCodec } from './codecs';
import { isHexString } from './utils';
import { ConnectQrQuery } from './types';
import { AppManifest } from "../api/fetchManifest";
import { extractDomain } from "../utils/extractDomain";

export const isValidDappDomain = (domain: string) => {
    // Check if domain contains at least one dot (.) character
    const dotIndex = domain.indexOf('.');
    return dotIndex !== -1 && dotIndex !== 0 && dotIndex !== domain.length - 1;
}

export type HandledConnectRequest = {
    type: 'handled',
    protocolVersion: number,
    request: ConnectRequest,
    clientSessionId: string,
    manifest: AppManifest | null,
    returnStrategy: string,
    manifestUrl: string,
}

export type HandledConnectRequestError = {
    type: 'invalid-manifest',
    returnStrategy: string,
}

export async function handleConnectDeeplink(query: ConnectQrQuery): Promise<HandledConnectRequest | HandledConnectRequestError> {
    const protocolVersion = Number(query.v);
    const parsed = JSON.parse(decodeURIComponent(query.r));
    const returnStrategy = query.ret;

    if (!connectRequestCodec.is(parsed)) {
        throw new Error('Invalid request');
    }
    const request = parsed as ConnectRequest;

    if (!isHexString(query.id)) {
        throw new Error('Invalid clientSessionId');
    }
    const clientSessionId = query.id;

    const domain = extractDomain(request.manifestUrl);

    if (!isValidDappDomain(domain)) {
        return {
            type: 'invalid-manifest',
            returnStrategy
        }
    }

    const manifest = await getAppManifest(request.manifestUrl);

    return {
        type: 'handled',
        protocolVersion,
        request,
        clientSessionId,
        manifest,
        returnStrategy,
        manifestUrl: request.manifestUrl,
    };
}
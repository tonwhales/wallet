import { ConnectRequest } from "@tonconnect/protocol";
import { getAppManifest } from "../getters/getAppManifest";
import { connectRequestCodec } from './codecs';
import { isHexString } from './utils';
import { ConnectQrQuery } from './types';

export async function handleConnectDeeplink(query: ConnectQrQuery) {
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

    const manifest = await getAppManifest(request.manifestUrl);

    return ({
        protocolVersion,
        request,
        clientSessionId,
        manifest,
        returnStrategy,
        manifestUrl: request.manifestUrl,
    });
}
import { ConnectRequest } from "@tonconnect/protocol";
import { connectRequestCodec } from "../../legacy/tonconnect/codecs";
import { ConnectQrQuery } from "../../legacy/tonconnect/types";
import { isHexString } from "../../legacy/tonconnect/utils";
import { getAppManifest } from "../../getters/getAppManifest";

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
    });
}
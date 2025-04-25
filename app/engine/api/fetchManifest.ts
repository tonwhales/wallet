import axios from "axios";
import { warn } from "../../utils/log";
import * as t from "io-ts";
import { isLeft } from "fp-ts/lib/Either";

export const appManifestCodec = t.type({
    name: t.string,
    url: t.string,
    iconUrl: t.string,
    termsOfUseUrl: t.union([t.undefined, t.string]),
    privacyPolicyUrl: t.union([t.undefined, t.string]),
});

export interface AppManifest {
    url: string;
    name: string;
    iconUrl: string;
    termsOfUseUrl: string | undefined;
    privacyPolicyUrl: string | undefined;
}

export async function fetchManifest(link: string) {
    let url: URL
    try {
        url = new URL(link);
    } catch (e) {
        warn(`fetchManifest error: ${e}`);
        return null;
    }
    
    const res = await axios.get(link);

    if (res.status === 200) {
        const parsed = appManifestCodec.decode(res.data);
        if (isLeft(parsed)) {
            return null;
        }
        return parsed.right as AppManifest;
    }

    return null;
}
import { Address } from "@ton/core";
import { fetchContractInfo } from "../engine/api/fetchContractInfo";
import { warn } from "./log";

export async function resolveBounceableTag(address: Address, options: { testOnly: boolean, bounceableFormat: boolean }) {
    try {
        const contractInfo = await fetchContractInfo(address.toString({ testOnly: options.testOnly }));
        const bounceableContract = contractInfo?.kind !== 'wallet';
        return bounceableContract ? true : options.bounceableFormat;
    } catch (e) {
        warn(`resolveBounceableTag error: ${e}`);
        return true;
    }
}
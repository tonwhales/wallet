import { Engine } from "../../../engine/Engine";
import { backoff } from "../../../utils/time";
import { startSumsubVerification } from "./startSumsubVerification";

export async function startIDVerification(engine: Engine) {

    // Fetch verification token
    let token = await engine.products.corp.beginIDVerification();

    // Perform verification
    let res = await startSumsubVerification({
        token,
        refetchToken: () => backoff('id', () => engine.products.corp.beginIDVerification()),
    });

    console.warn(res);

    // Commit
    if (res) {
        await engine.products.corp.commitIDVerification();
    }
}
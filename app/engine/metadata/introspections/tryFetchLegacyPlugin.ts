import { Address } from "@ton/core";
import { TonClient4 } from "@ton/ton";

export async function tryFetchLegacyPlugin(client: TonClient4, seqno: number, address: Address) {
    let response = await client.runMethod(seqno, address, 'get_subscription_data');
    if (response.exitCode !== 0 && response.exitCode !== 1) {
        return null;
    }
    if (response.result.length !== 10) {
        return null;
    }
    if (response.result[0].type !== 'tuple') {
        return null;
    }
    if (response.result[1].type !== 'tuple') {
        return null;
    }
    if (response.result[2].type !== 'int') {
        return null;
    }
    if (response.result[3].type !== 'int') {
        return null;
    }
    if (response.result[4].type !== 'int') {
        return null;
    }
    if (response.result[5].type !== 'int') {
        return null;
    }
    if (response.result[6].type !== 'int') {
        return null;
    }
    if (response.result[7].type !== 'int') {
        return null;
    }
    if (response.result[8].type !== 'int') {
        return null;
    }
    if (response.result[9].type !== 'int') {
        return null;
    }
    if (response.result[0].items[0].type !== 'int') {
        return null;
    }
    if (response.result[0].items[1].type !== 'int') {
        return null;
    }
    if (response.result[1].items[0].type !== 'int') {
        return null;
    }
    if (response.result[1].items[1].type !== 'int') {
        return null;
    }

    let wallet = new Address(
        Number(response.result[0].items[0].value),
        Buffer.from(response.result[0].items[1].value.toString(16).padStart(32, '0'), 'hex')
    );
    let beneficiary = new Address(
        Number(response.result[1].items[0].value),
        Buffer.from(response.result[1].items[1].value.toString(16).padStart(32, '0'), 'hex')
    );
    let amount = response.result[2].value;
    let period = Number(response.result[3].value);
    let startAt = Number(response.result[4].value);
    let timeout = Number(response.result[5].value);
    let lastPayment = Number(response.result[6].value);
    let lastRequest = Number(response.result[7].value);
    let failedAttempts = Number(response.result[8].value);
    let subscriptionId = response.result[9].value.toString(10);

    return {
        wallet,
        beneficiary,
        amount,
        period,
        startAt,
        timeout,
        lastPayment,
        lastRequest,
        failedAttempts,
        subscriptionId
    };
}
import { BN } from 'bn.js';
import { Address, beginCell, BitString, BitStringReader, Cell, TonClient4, } from 'ton';


// return begin_cell()
//     .store_int(seqno, 32)
//     .store_int(subwallet_id, 32)
//     .store_uint(public_key, 256)
//     .store_uint(config_public_key, 256)
//     .store_dict(allowed_destinations)
//     .store_grams(total_locked_value)
//     .store_dict(locked)
//     .store_grams(total_restricted_value)
//     .store_dict(restricted).end_cell();

export async function tryFetchLockup(client: TonClient4, seqno: number, address: Address) {
    let stateLite = await client.getAccountLite(seqno, address);
    if (stateLite.account.state.type !== 'active') {
        return null;
    }

    // Check code hash
    if (stateLite.account.state.codeHash !== 'iPv4GOR9XzKPfcNLrUMjuyihLsbHXOnsJdd3RsVuHe0=') {
        return null;
    }

    // Get full account
    let { account: { state } } = await client.getAccount(seqno, address);
    if (state.type !== 'active' || !state.data) {
        return null;
    }

    try {
        let dataCell = Cell.fromBoc(Buffer.from(state.data!, 'base64'))[0].beginParse();
        let walletSeqno = dataCell.readUintNumber(32);
        let subwalletId = dataCell.readUintNumber(32);
        let publicKey = dataCell.readBuffer(32);
        let configPublicKey = dataCell.readBuffer(32);
        let allowedDestinationsMap = dataCell.readOptDict(267, (slice) => { });
        let allowedDestinations: Address[] = [];
        if (allowedDestinationsMap) {
            for (let keyRaw of allowedDestinationsMap.keys()) {
                let key = new BN(keyRaw).toString(2);

                // check tag
                if (key.slice(0, 2) !== '10') {
                    continue;
                }

                // extract workchain and hash
                let [wc, hash] = [
                    parseInt(key.slice(2, 11), 2),
                    new BN(key.slice(11), 2),
                ]
                allowedDestinations.push(new Address(wc, hash.toBuffer()));
            }
        }
        let totalLockedValue = dataCell.readCoins();
        let locked = dataCell.readOptDict(32, (slice) => slice.readCoins());
        let totalRestrictedValue = dataCell.readCoins();
        let restricted = dataCell.readOptDict(32, (slice) => slice.readCoins());
        return {
            seqno: walletSeqno,
            subwalletId,
            publicKey,
            configPublicKey,
            allowedDestinations,
            totalLockedValue,
            locked,
            totalRestrictedValue,
            restricted,
        };
    } catch {
        return null;
    }
}
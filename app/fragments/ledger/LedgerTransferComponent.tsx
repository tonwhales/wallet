import BN from "bn.js";
import React from "react"
import { View } from "react-native"
import { delay } from "teslabot";
import { Address, Cell, CellMessage, CommonMessageInfo, ExternalMessage, SendMode, StateInit, TonClient4 } from "ton";
import { WalletV4Contract, WalletV4Source } from "ton-contracts";
import { TonPayloadFormat, TonTransport } from "ton-ledger";
import { fetchConfig } from "../../engine/api/fetchConfig";
import { fetchMetadata } from "../../engine/metadata/fetchMetadata";
import { pathFromAccountNumber } from "../../utils/pathFromAccountNumber";
import { backoff } from "../../utils/time";

export const LedgerTransferComponent = React.memo((
    {
        transport,
        account,
        addr,
        tonClient4
    }: {
        transport: TonTransport,
        account: number,
        addr: { address: string, publicKey: Buffer },
        tonClient4: TonClient4
    }
) => {

    let path = pathFromAccountNumber(account);
    const [address, setAddress] = React.useState<Address | null>(null);
    const [value, setValue] = React.useState<BN | null>(null);
    const [comment, setComment] = React.useState<string>('');
    const [loading, setLoading] = React.useState<string | null>(null);
    const valid = React.useMemo(() => {
        if (addr && value) {
            return true;
        } else {
            return false;
        }
    }, [addr, value]);
    const send = React.useCallback(() => {
        if (loading) {
            return;
        }
        if (!address) {
            return;
        }
        setLoading('Preparing...');

        // Fetch seqno
        (async () => {

            try {
                // Loading info
                let source = WalletV4Source.create({ workchain: 0, publicKey: addr.publicKey });
                let contract = new WalletV4Contract(Address.parse(addr.address), source);
                // Fetch data
                const [
                    config,
                    [seqno, account, metadata, state]
                ] = await Promise.all([
                    backoff('transfer', () => fetchConfig()),
                    backoff('transfer', async () => {
                        let block = await backoff('transfer', () => tonClient4.getLastBlock());
                        return Promise.all([
                            block.last.seqno,
                            backoff('transfer', () => tonClient4.getAccountLite(block.last.seqno, contract.address)),
                            backoff('transfer', () => fetchMetadata(tonClient4, block.last.seqno, address)),
                            backoff('transfer', () => tonClient4.getAccount(block.last.seqno, address))
                        ])
                    }),
                ]);

                let bounce = state.account.state.type === 'active';


                // Signing
                let payload: TonPayloadFormat | undefined = undefined;
                if (comment.trim().length > 0) {
                    payload = { type: 'comment', text: comment.trim() };
                }
                setLoading('Awaiting signing...');
                let signed = await transport.signTransaction(path, {
                    to: address!,
                    sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
                    amount: value!,
                    seqno,
                    timeout: Math.floor((Date.now() / 1000) + 60),
                    bounce,
                    payload
                });

                // Sending
                setLoading('Sending...');
                let extMessage = new ExternalMessage({
                    to: contract.address,
                    body: new CommonMessageInfo({
                        stateInit: seqno === 0 ? new StateInit({ code: source.initialCode, data: source.initialData }) : null,
                        body: new CellMessage(signed)
                    })
                });
                let msg = new Cell();
                extMessage.writeTo(msg);

                // Transfer
                await backoff('transfer',() => tonClient4.sendMessage(msg.toBoc({ idx: false })));

                // Awaiting
                setLoading('Awaiting transaction...');
                await backoff('tx-await', async () => {
                    while (true) {
                        if (!account.account.last) {
                            return;
                        }
                        let changed = await tonClient4.isAccountChanged(seqno, contract.address, new BN(account.account.last.lt, 10));
                        if (!changed.changed) {
                            return;
                        }
                        await delay(1000);
                    }
                });
            } catch (e) {
                console.warn(e);
            } finally {
                setLoading(null);
            }
        })()

    }, [addr, value, valid, loading, comment]);

    return (
        <View>

        </View>
    );
});
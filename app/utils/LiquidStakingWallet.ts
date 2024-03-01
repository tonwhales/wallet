import { Address, Cell, Contract, ContractProvider, Dictionary, SendMode, Sender, beginCell } from "@ton/core";

export class LiquidStakingWallet implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) { }

    static createFromAddress(address: Address) {
        return new LiquidStakingWallet(address);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell()
        });
    }

    async sendInternalTransfer(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        queryId: bigint,
        amount: bigint,
        responseAddress?: Address | null
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x178d4519, 32)
                .storeUint(queryId, 64)
                .storeCoins(amount)
                .storeAddress(via.address)
                .storeAddress(responseAddress)
                .storeCoins(0)
                .endCell()
        });
    }

    async sendTransfer(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        queryId: bigint,
        to: Address,
        amount: bigint,
        responseAddress?: Address | null
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0xf8a7ea5, 32)
                .storeUint(queryId, 64)
                .storeCoins(amount)
                .storeAddress(to)
                .storeAddress(responseAddress)
                .storeDict()
                .storeCoins(0)
                .endCell()
        });
    }

    async sendBurn(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        queryId: bigint,
        amount: bigint,
        responseAddress?: Address | null
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x595f07bc, 32)
                .storeUint(queryId, 64)
                .storeCoins(amount)
                .storeAddress(responseAddress)
                .storeDict()
                .endCell()
        });
    }

    async sendBurnResponse(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        queryId: bigint,
        roundId: number,
        withdrawalAmount: bigint,
        responseAddress?: Address | null
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x2334e467, 32)
                .storeUint(queryId, 64)
                .storeUint(roundId, 32)
                .storeCoins(withdrawalAmount)
                .storeAddress(responseAddress)
                .storeDict()
                .endCell()
        });
    }

    async sendProvideDebt(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        queryId: bigint,
        toRoundId: number
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x9006210c, 32)
                .storeUint(queryId, 64)
                .storeUint(toRoundId, 32)
                .endCell()
        });
    }

    // storage#_ balance:Coins owner_address:MsgAddressInt jetton_master_address:MsgAddressInt jetton_wallet_code:^Cell pending_withdrawals:(Maybe ^Cell) = Storage;
    async getState(provider: ContractProvider) {
        let state = await provider.getState();

        if (state.state.type !== 'active' || !state.state.data) {
            return null;
        }

        let ds = Cell.fromBoc(state.state.data)[0].beginParse();
        return {
            data: {
                balance: ds.loadCoins(),
                owner: ds.loadAddress(),
                master: ds.loadAddress(),
                code: ds.loadRef(),
                pendingWithdrawals: ds.loadDict(Dictionary.Keys.Uint(32), {
                    parse: (src) => src.loadCoins(),
                    serialize: (src, builder) => builder.storeCoins(src)
                })
            },
            balance: state.balance
        };
    }
}

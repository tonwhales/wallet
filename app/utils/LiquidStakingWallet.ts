import { Address, Cell, Contract, ContractProvider, Dictionary, SendMode, Sender, beginCell, contractAddress } from "@ton/core";

const LIQUID_STAKING_WALLET_CODE = {"hex":"b5ee9c7241021d01000558000114ff00f4a413f4bcf2c80b01020162050202016604030021b7605da89a1f401f481f481a9e808606100023b66b1da89a1f401f481f481a9e80860d88300202cb160602012010070201200c080201480b0901c5200835c87b51343e803e903e90353d010c0174c7c8608405e351466e88a0841ef765f7aeac638e40608425e5fc3eeea38a34cfcc7e8034c7cc32163e809005a0083d10c40d104c3214017e809400f3c58073c5b33d00327b552557c1bcb0b178b8c3600a003a31d33f31fa003014a04134c85005fa025003cf1601cf16ccf400c9ed5400f116fb51343e803e903e90353d010c1454b1c17cb8124174cff4c7fe803e900c14c9e0083d039be865be800c04a800644c38b2163e809001e0083d10c5b214017e809400f3c58073c5b33d00327b550835c2c070c02387e084354c9db6dc20043232c15400f3c588be8084b2dab2c7f2cff26010bec02456f8a00201200f0d01e55ed44d0fa00fa40fa40d4f404305172c705f2e049820898968005aa0015a08208e4e1c0aa00a015bcf2e2c3820898968070fb0205d33fd31f305155218020f47f6fa570209520c10a13b08e1b52258020f45b3003fa003014a051128020f47e6fa505a410454430e86c31830626514904493980e007e82109797f0fbc8cb1f14cb3f01fa02cb1f58cf16c9718018c8cb055004cf1670fa0213cb6a12ccc901fb000403c85005fa025003cf1601cf16ccf400c9ed5401f54ed44d0fa00fa40fa40d4f4043008d33ffa00fa403021c00093315250de5161a1524ac705f2e2c128c2fff2e2c2820898968007a70317a08208e4e1c0a703a017bcf2e2c3820898968070fb0282107bdd97dec8cb1f16cb3f5004fa0221cf1658cf16c9718018c8cb0524cf1670fa02cb6accc98306fb000350248130201f4141101f13b51343e803e903e90353d010c0274cffe8014586801be903e9014db31c1551cdd9c150804d50500db7214017e809400f3c58073c5b33d003248b232c044bd003d0032c0327e401c1d3232c0b281f2fff2741403b1c1476c7cb8b0c2fe80146e6860822625a020822625a004ad822860823938702806684a201201f68e38528aa019a182107362d09cc8cb1f5230cb3f58fa025008cf165008cf16c9718010c8cb0525cf165007fa0216cb6a15ccc971fb001035103497104a1039385f04e226d70b01c30024c200b08e238210d53276db708010c8cb055009cf165005fa0217cb6a13cb1f13cb3fc972fb0050039410266c32e2400304130024c85005fa025003cf1601cf16ccf400c9ed5401f500f4cffe803e90087c007b51343e803e903e90353d010c1451e8548ef1c17cb8b04a70bffcb8b0950d455c150804d50500db7214017e809400f3c58073c5b33d003248b232c044bd003d0032c032483e401c1d3232c0b281f2fff274017e903d010c7e800835d270803cb8b11de0063232c1540273c59c3e8086201500bccb6b13cc8210178d4519c8cb1f1acb3f5008fa0223cf165007cf1626fa025004cf16c95006cc2491729171e25009a814a08208e4e1c0aa008208989680a0a015bcf2e2c505c98040fb001314c85005fa025003cf1601cf16ccf400c9ed540201481a170201581918004120840ee6b2802a43007c01806a80904c33c0600b8072c1c07c01806a8084b3c060003b1c081c638500deaa43298c092a04a800ea81c0a9087000110c398c1b04a00201481c1b00113e910c1c2ebcb8536000f70831c02497c138007434c0c05c6c2544d7c0fc07783e903e900c7e800c5c75c87e800c7e800c1cea6d0000b4c7c8608403e29fa96ea54c4d167c05b808608405e351466ea58c511100fc05f80d4820841657c1ef2ea50c167c063808208408cd3919eea50c167c07382084240188432ea4d67c06f817c12103fcbc203bdbc273"};

export class LiquidStakingWallet implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) { }

    static contractAddress(owner: Address, master: Address) {
        const code = Cell.fromBoc(Buffer.from(LIQUID_STAKING_WALLET_CODE.hex, 'hex'))[0];
        const data = beginCell()
            .storeCoins(0)
            .storeAddress(owner)
            .storeAddress(master)
            .storeRef(code)
            .storeDict()
            .endCell();

        return contractAddress(0, { code, data });
    }

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

import BN from "bn.js";
import { Address, Cell, StateInit } from "ton";

export function createDeployPluginCell(
    seqno: number,
    walletId: number,
    timeout: number,
    to: Address
) {
    const cell = new Cell();
    // subwallet_id
    cell.bits.writeUint(walletId, 32);
    // valid_until
    if (seqno === 0) {
        for (let i = 0; i < 32; i++) {
            cell.bits.writeBit(1);
        }
    } else {
        cell.bits.writeUint(timeout, 32);
    }
    
    cell.bits.writeUint(seqno, 32);                             // msg_seqno
    cell.bits.writeUint(1, 8);                                  // op == 1 deploy & install plugin
    cell.bits.writeInt(to.workChain, 8);                        // plugin_workchain
    cell.bits.writeCoins(new BN(100000000));                    // plugin_balance

    // state_init
    let code = Cell.fromBoc(Buffer.from('b5ee9c7201020f01000262000114ff00f4a413f4bcf2c80b0102012002030201480405036af230db3c5335a127a904f82327a128a90401bc5135a0f823b913b0f29ef800725210be945387f0078e855386db3ca4e2f82302db3c0b0c0d0202cd06070121a0d0c9b67813f488de0411f488de0410130b048fd6d9e05e8698198fd201829846382c74e2f841999e98f9841083239ba395d497803f018b841083ab735bbed9e702984e382d9c74688462f863841083ab735bbed9e70156ba4e09040b0a0a080269f10fd22184093886d9e7c12c1083239ba39384008646582a803678b2801fd010a65b5658f89659fe4b9fd803fc1083239ba396d9e40e0a04f08e8d108c5f0c708210756e6b77db3ce00ad31f308210706c7567831eb15210ba8f48305324a126a904f82326a127a904bef27109fa4430a619f833d078d721d70b3f5260a11bbe8e923036f82370708210737562732759db3c5077de106910581047103645135042db3ce0395f076c2232821064737472ba0a0a0d09011a8e897f821064737472db3ce0300a006821b39982100400000072fb02de70f8276f118010c8cb055005cf1621fa0214f40013cb6912cb1f830602948100a032dec901fb000030ed44d0fa40fa40fa00d31fd31fd31fd31fd31fd307d31f30018021fa443020813a98db3c01a619f833d078d721d70b3fa070f8258210706c7567228018c8cb055007cf165004fa0215cb6a12cb1f13cb3f01fa02cb00c973fb000e0040c8500acf165008cf165006fa0214cb1f12cb1fcb1fcb1fcb1fcb07cb1fc9ed54005801a615f833d020d70b078100d1ba95810088d721ded307218100ddba028100deba12b1f2e047d33f30a8ab0f', 'hex'))[0];
    //  body
    let data = new Cell();

    data.bits.writeAddress(to);                                 // wallet 
    data.bits.writeAddress(to);                                 // beinificiary address
    data.bits.writeCoins(new BN(100000000));                    // amount
    data.bits.writeUint(60 * 1 * 60, 32);                       // period 1 hour
    data.bits.writeUint(Math.floor(Date.now() / 1e3) + 10, 32); // start_time
    data.bits.writeUint(0, 32);                                 // timeout
    data.bits.writeUint(Math.floor(Date.now() / 1e3) + 10, 32); // last_payment_time
    data.bits.writeUint(Math.floor(Date.now() / 1e3) + 10, 32); // last_request_time
    data.bits.writeUint(1, 8);                                  // failed attempts
    data.bits.writeUint(0, 32);                                 // subscription id

    let stateInit = new Cell();
    new StateInit({ code, data }).writeTo(stateInit);

    cell.withReference(stateInit);
    cell.withReference(new Cell()); // or plugin initial message

    return cell;
}
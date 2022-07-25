import BN from "bn.js";
import { Address, Cell } from "ton";
import { getRandomQueryId } from "./createWithdrawStakeCommand";

export function createRemovePluginCell(
    seqno: number,
    walletId: number,
    timeout: number,
    to: Address,
    amount: BN
) {
    const cell = new Cell();
    cell.bits.writeUint(walletId, 32);
    if (seqno === 0) {
        for (let i = 0; i < 32; i++) {
            cell.bits.writeBit(1);
        }
    } else {
        cell.bits.writeUint(timeout, 32);
    }
    cell.bits.writeUint(seqno, 32);
    cell.bits.writeUint8(3); // Remove plugin command

    cell.bits.writeUint8(to.workChain);
    cell.bits.writeBuffer(to.hash);
    // cell.bits.writeCoins(100000); // Gas
    cell.bits.writeCoins(amount); // Gas
    cell.bits.writeUint(getRandomQueryId(), 64); // Query ID
    return cell;
}
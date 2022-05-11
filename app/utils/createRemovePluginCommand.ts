import { Address, Cell } from "ton";
import { getRandomQueryId } from "./createWithdrawStakeCommand";

export function createRemovePluginCommand(
    seqno: number,
    walletId: number,
    timeout: number,
    to: Address
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
    cell.bits.writeUint8(3); // Simple order

    // Write order
    // cell.bits.writeUint8(this.sendMode);
    // let orderCell = new Cell();
    // this.order.writeTo(orderCell);
    cell.bits.writeUint8(to.workChain);
    cell.bits.writeBuffer(to.hash);
    cell.bits.writeCoins(0); // Gas
    cell.bits.writeUint(getRandomQueryId(), 64); // Query ID
    // cell.refs.push(orderCell);
    return cell;
}
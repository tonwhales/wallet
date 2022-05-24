import BN from "bn.js";
import { Address, Cell } from "ton";
import { getRandomQueryId } from "./createWithdrawStakeCommand";

export function createInstallPluginCell(
    seqno: number,
    walletId: number,
    timeout: number,
    to: Address,
    amount: BN
) {
    const cell = new Cell();
    cell.bits.writeUint(walletId, 32);           // subwallet_id
    // valid_until
    if (seqno === 0) {
        for (let i = 0; i < 32; i++) {
            cell.bits.writeBit(1);
        }
    } else {
        cell.bits.writeUint(timeout, 32);
    }
    
    cell.bits.writeUint(seqno, 32);              // msg_seqno
    cell.bits.writeUint(2, 8);                   // op == 1 deploy & install plugin
    cell.bits.writeAddress(to);                  // wallet 
    cell.bits.writeCoins(amount);                // amount
    cell.bits.writeUint(getRandomQueryId(), 64); // Query ID

    return cell;
}
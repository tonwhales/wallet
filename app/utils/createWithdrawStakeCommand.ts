import BN from "bn.js";
import { Cell } from "ton";

export function createWithdrawStakeCommand(queryId: number, amount: BN) {
  const addStakeCommand = new Cell();
  addStakeCommand.bits.writeUint(3665837821, 32);
  addStakeCommand.bits.writeUint(queryId, 64); // Query ID
  addStakeCommand.bits.writeCoins(100000); // Gas
  addStakeCommand.bits.writeCoins(amount); // Amount
  return addStakeCommand;
}
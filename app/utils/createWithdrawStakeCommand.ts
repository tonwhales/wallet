import BN from "bn.js";
import { Cell } from "ton";

export function getRandomQueryId() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

export function createWithdrawStakeCell(amount: BN) {
  const addStakeCommand = new Cell();
  addStakeCommand.bits.writeUint(3665837821, 32);
  addStakeCommand.bits.writeUint(getRandomQueryId(), 64); // Query ID
  addStakeCommand.bits.writeCoins(100000); // Gas
  addStakeCommand.bits.writeCoins(amount); // Amount
  return addStakeCommand;
}
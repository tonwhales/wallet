import BN from "bn.js";
import { Cell, beginCell } from "@ton/core";

export function getRandomQueryId() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

export function createWithdrawStakeCell(amount: bigint) {
  const addStakeCommand = beginCell();
  addStakeCommand.storeUint(3665837821, 32);
  addStakeCommand.storeUint(getRandomQueryId(), 64); // Query ID
  addStakeCommand.storeCoins(100000); // Gas
  addStakeCommand.storeCoins(amount); // Amount
  return addStakeCommand.endCell();
}
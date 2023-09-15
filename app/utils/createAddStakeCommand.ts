import { Cell, beginCell } from "@ton/core";
import { getRandomQueryId } from "./createWithdrawStakeCommand";

export function createAddStakeCommand() {
    const addStakeCommand = beginCell();
    addStakeCommand.storeUint(2077040623, 32);
    addStakeCommand.storeUint(getRandomQueryId(), 64); // Query ID
    addStakeCommand.storeCoins(100000); // Gas
    return addStakeCommand.endCell();
  }
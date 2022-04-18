import { Cell } from "ton";
import { getRandomQueryId } from "./createWithdrawStakeCommand";

export function createAddStakeCommand() {
    const addStakeCommand = new Cell();
    addStakeCommand.bits.writeUint(2077040623, 32);
    addStakeCommand.bits.writeUint(getRandomQueryId(), 64); // Query ID
    addStakeCommand.bits.writeCoins(100000); // Gas
    return addStakeCommand;
  }
import { Address, Cell } from "@ton/core"

export type Job = {
    type: 'transaction',
    target: Address,
    amount: bigint,
    text: string,
    payload: Cell | null,
    stateInit: Cell | null,
} | {
    type: 'sign',
    text: string,
    textCell: Cell
    payloadCell: Cell
}
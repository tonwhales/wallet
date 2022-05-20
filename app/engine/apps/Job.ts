import BN from "bn.js"
import { Address, Cell } from "ton"

export type Job = {
    type: 'transaction',
    target: Address,
    amount: BN,
    text: string,
    payload: Cell | null,
    stateInit: Cell | null,
} | {
    type: 'sign',
    text: string,
    textCell: Cell
    payloadCell: Cell
}
import BN from "bn.js"
import { Address, Cell } from "ton"

export type Job = {
    type: 'transaction',
    target: Address,
    amount: BN,
    text: string,
    payload: Cell,
    payloadHint: string | null
} | {
    type: 'sign',
    text: string,
    payload: Cell,
    payloadHint: string | null
}
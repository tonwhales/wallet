import { Address, Cell } from "@ton/core"
import { ConnectPushQuery, ConnectQrQuery } from "../../engine/tonconnect"
import { TransactionRequestURL, TransferRequestURL } from "@solana/pay"

export enum ResolveUrlError {
    InvalidAddress = 'InvalidAddress',
    InvalidPayload = 'InvalidPayload',
    InvalidStateInit = 'InvalidStateInit',
    InvalidJetton = 'InvalidJetton',
    InvalidAmount = 'InvalidAmount',
    InvalidJettonFee = 'InvalidJettonFee',
    InvalidJettonForward = 'InvalidJettonForward',
    InvalidJettonAmounts = 'InvalidJettonAmounts',
    InvalidInappUrl = 'InvalidInappUrl',
    InvalidExternalUrl = 'InvalidExternalUrl',
    InvalidHoldersPath = 'InvalidHoldersPath',
    InvalidSolanaTransferUrl = 'InvalidSolanaTransferUrl',
    InvalidExpiresAt = 'InvalidExpiresAt'
}

export type ResolvedTonTxUrl = {
    type: 'transaction',
    address: Address,
    isBounceable?: boolean,
    comment: string | null,
    amount: bigint | null,
    payload: Cell | null,
    stateInit: Cell | null,
    expiresAt?: number
}

export type ResolvedDomainUrl = {
    type: 'domain-transfer',
    domain: string,
    comment: string | null,
    amount: bigint | null,
    payload: Cell | null,
    stateInit: Cell | null,
    expiresAt?: number
}

export type ResolvedDomainJettonUrl = {
    type: 'domain-jetton-transfer',
    domain: string,
    jettonMaster: Address,
    comment: string | null,
    amount: bigint | null,
    payload: Cell | null,
    feeAmount: bigint | null,
    forwardAmount: bigint | null,
    expiresAt?: number
}

export type ResolvedJettonTxUrl = {
    type: 'jetton-transaction',
    address: Address,
    isBounceable?: boolean,
    jettonMaster: Address,
    comment: string | null,
    amount: bigint | null,
    payload: Cell | null,
    feeAmount: bigint | null,
    forwardAmount: bigint | null,
    expiresAt?: number
}

export type ResolvedTxUrl = ResolvedTonTxUrl | ResolvedJettonTxUrl | ResolvedDomainUrl | ResolvedDomainJettonUrl;

export type ResolvedUrl = ResolvedTxUrl
    | {
        type: 'connect',
        session: string,
        endpoint: string | null
    } | {
        type: 'install',
        url: string,
        customTitle: string | null,
        customImage: { url: string, blurhash: string } | null
    } | {
        type: 'tonconnect',
        query: ConnectQrQuery
    } | {
        type: 'tonconnect-request',
        query: ConnectPushQuery
    } | {
        type: 'tx',
        address: string,
        hash: string,
        lt: string
    } | {
        type: 'in-app-url',
        url: string,
    } | {
        type: 'external-url',
        url: string,
    } | {
        type: 'error',
        error: ResolveUrlError
    } | {
        type: 'holders-transactions',
        query: { [key: string]: string | undefined }
    } | {
        type: 'holders-path',
        path: string,
        query: { [key: string]: string | undefined }
    } | {
        type: 'holders-invite',
        inviteId: string
    } | {
        type: 'solana-transfer',
        request: TransactionRequestURL | TransferRequestURL
    }
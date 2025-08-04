import { ChangellyTransactionModel } from "../api/changelly";

const IS_INITIAL_STATUSES = ['new', 'waiting'];
const IS_PENDING_STATUSES = ['confirming', 'exchanging', 'sending'];
const IS_SUCCESS_STATUSES = ['finished'];
const IS_FAILURE_STATUSES = [
    'refunded',
    'hold',
    'expired',
    'overdue',
    'resolved',
    'failed'
];
export function getOrderState(status: ChangellyTransactionModel['status']): {
    isInitial: boolean;
    isPending: boolean;
    isSuccess: boolean;
    isFailure: boolean;
} {
    const isInitial = IS_INITIAL_STATUSES.includes(status);
    const isPending = IS_PENDING_STATUSES.includes(status);
    const isSuccess = IS_SUCCESS_STATUSES.includes(status);
    const isFailure = IS_FAILURE_STATUSES.includes(status);

    return {
        isInitial,
        isPending,
        isSuccess,
        isFailure
    };
}
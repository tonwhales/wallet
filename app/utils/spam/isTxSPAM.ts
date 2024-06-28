import { Address } from "@ton/core";
import { TransactionDescription } from "../../engine/types";
import { KnownWallet } from "../../secure/KnownWallets";
import { BigMath } from "../BigMath";
import { SPAM_KEYWORDS_EN, SPAM_KEYWORDS_RU } from "./spamKeywords";

const triggerScore = 100;
const enKeys = Object.entries(SPAM_KEYWORDS_EN);
const ruKeys = Object.entries(SPAM_KEYWORDS_RU);

function getKeywordsScore(str: string, keywords: [string, number][]) {
    const parts = str.split(' ')
        .map((pt) => pt.toLowerCase())
        // sub parts by \n and \r
        .flatMap((pt) => pt.split('\n'))
        .flatMap((pt) => pt.split('\r'));

    const included = parts.reduce((fullScore, part) => {
        const score = keywords.reduce((sum, item) => {
            const [key, value] = item;
            return sum + (part.includes(key) ? value : 0);
        }, 0);
        return fullScore + score;
    }, 0);

    return included;
}

// Check if the comment contains any of the SPAM patterns
export function matchesWeightedKeywords(comment?: string | null) {
    if (!comment) {
        return false;
    }

    const en_score = getKeywordsScore(comment, enKeys);

    // ealy return if the comment is already SPAM
    if (en_score >= triggerScore) {
        return true;
    }

    // additional check for ru keywords
    const ru_score = getKeywordsScore(comment, ruKeys);

    return (en_score + ru_score) >= triggerScore;
}

export function isTxSPAM(
    tx: TransactionDescription,
    config: {
        knownWallets: { [key: string]: KnownWallet },
        isDenyAddress: (addressString?: string | null) => boolean,
        spamWallets: string[],
        spamMinAmount: bigint,
        isTestnet: boolean
    }
) {
    const kind = tx.base.parsed.kind;
    const operation = tx.base.operation;
    const type = tx.base.parsed.body?.type
    const item = operation.items[0];
    const opAddress = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;
    const parsedOpAddr = Address.parseFriendly(opAddress);
    const parsedAddress = parsedOpAddr.address;
    const opAddressBounceable = parsedAddress.toString({ testOnly: config.isTestnet });

    if (kind !== 'in' || config.isTestnet) {
        return false;
    }

    if (config.isDenyAddress(opAddressBounceable)) {
        return true;
    }

    if (config.spamWallets.includes(opAddressBounceable)) {
        return true;
    }

    if (!!config.knownWallets[opAddressBounceable]) {
        return false;
    }

    if (type === 'comment') {
        const hasSPAMContext = matchesWeightedKeywords(operation.comment);
        const spamAmount = BigMath.abs(BigInt(tx.base.parsed.amount)) < config.spamMinAmount;

        return hasSPAMContext || spamAmount;
    } else if (type === 'payload' && item.kind === 'token') { // comments in token transfers
        return matchesWeightedKeywords(operation.comment);
    }

    return false;
}
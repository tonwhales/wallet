import { matchesWeightedKeywords } from "./isTxSPAM";

const spamComments = [
    `🎁Your wallet has won: 1,000 $TON
    CLAIM: https://tontp܂net
    Thank you for your participation in the $TON company.
    ❗Your reward is available, pick it up now`,
    'verification required to claim your prize http://scam.com',
    `Telegram 'USDTAwards_bot' - Claim Your Awards`,
    'https://t.me/USDTAwards_bot',
    'Check out this link: https://t.me/TON_Crystal_Airdrop_Bot?start=1234567',
    'https://t.me/TON_Crystal_Airdrop_Bot?start=1234567',
    'Congratulations! You are the lucky winner of our 1000 TON giveaway! Please visit our website to claim your prize: scam.com'
];

const notSpamComments = [
    'Deposit accepted',
    'NFT minted #123434455',
    'Not SPAM',
    'Hello world!',
    'Пополнение счета на 100USDT',
    'Withdraw pf 1000.321TON request accepted',
];

describe('matchesWeightedKeywords test', () => {
    it('should return false if comment is null', () => {
        const comment = null;
        const result = matchesWeightedKeywords(comment);
        expect(result).toBe(false);
    });

    it('should return true if comment is SPAM', () => {
        spamComments.forEach(comment => {
            const result = matchesWeightedKeywords(comment);
            if (!result) {
                expect(comment).toBe('SPAM');
            }
            expect(result).toBe(true);
        });
    });

    it('should return false if comment is not SPAM', () => {
        notSpamComments.forEach(comment => {
            const result = matchesWeightedKeywords(comment);
            expect(result).toBe(false);
        });
    });
});
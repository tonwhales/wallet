import MindboxSdk from "mindbox-sdk";

/**
 * Rounds a numeric string up to two decimal places and returns it formatted with exactly two decimals.
 *
 * @param value - The input string to parse as a number.
 * @returns The value rounded up to two decimal places as a string with exactly two decimals, or the original `value` if it cannot be parsed as a number or an error occurs.
 */
function roundUpTo2Decimals(value: string): string {
    try {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        return (Math.ceil(num * 100) / 100).toFixed(2);
    } catch (error) {
        return value;
    }
}

export enum MaestraEvent {
    SessionStart = 'SessionStart',
    WalletSeedImported = 'Authorization',
    ViewStakingPage = 'ViewStakingPage',
    ViewReceivePage = 'ViewReceivePage',
    ViewSwapPage = 'ViewSwapPage',
    ViewScanPage = 'ViewScanPage',
    ViewSendPage = 'ViewSendPage',
    ViewCardIssuePage = 'ViewCardIssuePage',
    SentCurrency = 'SentCurrency',
    SwappedCurrency = 'SwappedCurrency',
}

export function trackMaestraEvent(event: MaestraEvent, customer: {
    walletID: string,
    tonhubID?: string,
    customFields?: any,
}) {
    MindboxSdk.executeAsyncOperation({
        operationSystemName: event,
        operationBody: {
            customer: {
                ids: customer.tonhubID ? {
                    tonhubID: customer.tonhubID,
                    cryptoAccountId: customer.walletID
                } : {
                    cryptoAccountId: customer.walletID
                },
                customFields: customer.customFields
            }
        }
    });
}

/**
 * Track a sent-currency event in Mindbox using the provided transaction and customer details.
 *
 * The reported order price is rounded up to two decimal places before sending.
 *
 * @param amount - The amount sent, as a string (will be rounded up to 2 decimals for reporting)
 * @param currency - The currency code for the sent amount
 * @param walletID - The customer's crypto account identifier used as the wallet id
 * @param tonhubID - Optional Tonhub identifier to include alongside the wallet ID
 * @param transactionID - The unique transaction identifier used as the order id
 */
export function trackMaestraSent({
    amount,
    currency,
    walletID,
    tonhubID,
    transactionID,
}: {
    amount: string;
    currency: string;
    walletID: string;
    tonhubID?: string;
    transactionID: string;
}) {
    const totalPrice = roundUpTo2Decimals(amount);

    MindboxSdk.executeAsyncOperation({
        operationSystemName: MaestraEvent.SentCurrency,
        operationBody: {
            order: {
                totalPrice,
                ids: {
                    CurrencySendingID: transactionID
                },
                lines: [
                    {
                        basePricePerItem: totalPrice,
                        quantity: '1',
                        customFields: {
                            orderlineCurrency: currency,
                        },
                        product: {
                            ids: {
                                wallet: walletID
                            }
                        }

                    }
                ]
            },
            customer: {
                ids: tonhubID ? {
                    tonhubID,
                    cryptoAccountId: walletID
                } : {
                    cryptoAccountId: walletID
                }
            }
        },
    });
}

/**
 * Send a currency swap event to Mindbox with order and customer identifiers.
 *
 * The provided amounts are rounded up to two decimal places before being included in the order payload; `transactionID` is mapped to the order `ExchangeID`.
 *
 * @param amountFrom - Amount debited from the source currency (string; will be rounded up to 2 decimals)
 * @param amountTo - Amount credited in the target currency (string; will be rounded up to 2 decimals)
 * @param currencyFrom - Source currency code
 * @param currencyTo - Target currency code
 * @param walletID - Wallet identifier used as the customer's cryptoAccountId and product wallet id
 * @param tonhubID - Optional Tonhub identifier; when provided it will be included alongside `cryptoAccountId`
 * @param transactionID - External transaction identifier used as the order `ExchangeID`
 */
export function trackMaestraSwapped({
    amountFrom,
    amountTo,
    currencyFrom,
    currencyTo,
    walletID,
    tonhubID,
    transactionID,
}: {
    amountFrom: string;
    amountTo: string;
    currencyFrom: string;
    currencyTo: string;
    walletID: string;
    tonhubID?: string;
    transactionID: string;
}) {
    const totalPrice = roundUpTo2Decimals(amountFrom);
    const basePricePerItem = roundUpTo2Decimals(amountTo);

    MindboxSdk.executeAsyncOperation({
        operationSystemName: MaestraEvent.SwappedCurrency,
        operationBody: {
            order: {
                totalPrice,
                ids: {
                    ExchangeID: transactionID
                },
                lines: [
                    {
                        basePricePerItem,
                        quantity: '1',
                        customFields: {
                            exchangeSourceCurrency: currencyFrom,
                            exchangeTargetCurrency: currencyTo,
                        },
                        product: {
                            ids: {
                                wallet: walletID
                            }
                        }
                    }
                ]
            },
            customer: {
                ids: tonhubID ? {
                    tonhubID,
                    cryptoAccountId: walletID
                } : {
                    cryptoAccountId: walletID
                }
            }
        }
    });
}
import MindboxSdk from "mindbox-sdk";

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
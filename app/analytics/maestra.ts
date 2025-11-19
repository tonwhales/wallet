import MindboxSdk from "mindbox-sdk";

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

export function trackSent({
    amount,
    currency,
    walletID,
    tonhubID,
    transactionID,
}: {
    amount: string;
    currency: string;
    walletID: string;
    tonhubID: string;
    transactionID: string;
}) {
    MindboxSdk.executeAsyncOperation({
        operationSystemName: MaestraEvent.SentCurrency,
        operationBody: {
            order: {
                totalPrice: amount,
                ids: {
                    CurrencySendingID: transactionID
                },
                lines: [
                    {
                        basePricePerItem: amount,
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
                ids: {
                    tonhubID
                }
            }
        },
    });
}

export function trackSwapped({
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
    tonhubID: string;
    transactionID: string;
}) {
    MindboxSdk.executeAsyncOperation({
        operationSystemName: MaestraEvent.SwappedCurrency,
        operationBody: {
            order: {
                totalPrice: amountFrom,
                ids: {
                    ExchangeID: transactionID
                },
                lines: [
                    {
                        basePricePerItem: amountTo,
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
                ids: {
                    tonhubID
                }
            }
        }
    });
}
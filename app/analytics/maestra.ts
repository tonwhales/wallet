import MindboxSdk from "mindbox-sdk";

export function trackMaestraAuth(userId: string) {
    MindboxSdk.executeAsyncOperation({
        operationSystemName: 'Tonhub.AuthInMobileApp',
        operationBody: {
            customer: {
                ids: {
                    tonhubID: userId,
                    backendUserID: userId
                },
                subscriptions: [{
                    brand: 'tonhub',
                    pointOfContact: 'Mobilepush'
                }]
            }
        }
    });
}

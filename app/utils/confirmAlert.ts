import { Alert } from "react-native";
import { LocalizedResources } from "../i18n/schema";
import { t } from "../i18n/t";

export async function confirmAlert(title: LocalizedResources, message?: string) {
    return await new Promise<boolean>(resolve => {
        Alert.alert(t(title), `${message ? message + ' ' : ''}${t('transfer.confirm')}`, [{
            text: t('common.yes'),
            style: 'destructive',
            onPress: () => {
                resolve(true)
            }
        }, {
            text: t('common.no'),
            onPress: () => {
                resolve(false);
            }
        }])
    });
}
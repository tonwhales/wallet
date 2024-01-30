import { memo, useCallback, useMemo } from "react";
import { ParsedJob } from "../../../engine/hooks/dapps/useCurrentJob";
import { getConnectionReferences } from "../../../storage/appState";
import { useAppData, useNetwork } from "../../../engine/hooks";
import { t } from "../../../i18n/t";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { DappRequestButton } from "./DappRequestButton";

type TonXRequestButtonProps = {
    request: ParsedJob,
    divider?: boolean
}

export const TonXRequestButton = memo((props: TonXRequestButtonProps) => {
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();

    const url = useMemo(() => {
        const refs = getConnectionReferences();
        if (!refs) {
            return;
        }
        return refs.find(
            (ref) => ref.key === props.request.key
                .toString('base64')
                .replace(/\//g, '_')
                .replace(/\+/g, '-')
                .replace(/\=/g, '')
        )?.url;
    }, [props.request.key]);

    const appData = useAppData(url ?? '');

    const title = useMemo(() => {
        if (props.request.job.type === 'transaction') {
            return t('products.transactionRequest.title');
        } else {
            return t('products.signatureRequest.title');
        }
    }, [props]);

    const subtitle = useMemo(() => {
        return appData?.title ?? 'Unknown app';
    }, [appData]);

    const image = appData?.image?.preview256;

    const onPress = useCallback(() => {
        if (props.request.job.type === 'transaction') {
            navigation.navigateTransfer({
                order: {
                    type: 'order',
                    messages: [{
                        target: props.request.job.target.toString({ testOnly: isTestnet }),
                        amount: props.request.job.amount,
                        payload: props.request.job.payload,
                        stateInit: props.request.job.stateInit,
                        amountAll: false
                    }]
                },
                job: props.request.jobRaw,
                text: props.request.job.text,
                callback: null
            });
        } else {
            const connection = getConnectionReferences().find((v) => Buffer.from(v.key, 'base64').equals(props.request.key));
            if (!connection) {
                return; // Just in case
            }
            navigation.navigateSign({
                text: props.request.job.text,
                textCell: props.request.job.textCell,
                payloadCell: props.request.job.payloadCell,
                job: props.request.jobRaw,
                callback: null,
                name: connection.name
            });
        }
    }, [props]);

    return (
        <DappRequestButton
            title={title}
            subtitle={subtitle}
            onPress={onPress}
            image={image}
            divider={props.divider}
        />
    )
});
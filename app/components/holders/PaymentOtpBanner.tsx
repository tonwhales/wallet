import { memo, useEffect, useState } from "react";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useHoldersOtp, useNetwork, useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import { t } from "../../i18n/t";
import { Image } from "expo-image";
import { getHoldersToken } from "../../engine/hooks/holders/useHoldersAccountStatus";
import { holdersUrl } from "../../engine/api/holders/fetchUserState";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment";
import { useLockAppWithAuthState } from "../../engine/hooks/settings";
import { queryClient } from "../../engine/clients";
import { Queries } from "../../engine/queries";
import { Address } from "@ton/core";
import { fetchOtpAnswer } from "../../engine/api/holders/fetchOtpAnswer";

const AcceptIcon = <Image style={{ height: 16, width: 16 }} source={require('@assets/ic-accept-otp.png')} />;
const DeclineIcon = <Image style={{ height: 16, width: 16 }} source={require('@assets/ic-decline-otp.png')} />;

const gradientColors: [string, string] = ['#478CF3', '#372DC8'];

const OtpTimer = memo(({ expireAt, onExpired }: { expireAt: Date, onExpired: () => void }) => {
    const theme = useTheme();

    const [timeLeft, setTimeLeft] = useState(expireAt.getTime() - Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            const diff = expireAt.getTime() - Date.now();
            if (diff <= 0 || timeLeft <= 0) {
                onExpired();
                return;
            }
            setTimeLeft(diff);
        }, 1000);

        return () => clearInterval(interval);
    }, [expireAt, onExpired, timeLeft]);

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor(timeLeft / 1000) % 60;

    const expired = timeLeft <= 0;

    if (expired) {
        return (
            <View style={styles.timer}>
                <View style={styles.timerItem}>
                    <View style={[styles.timerItemBack, { backgroundColor: theme.warning, opacity: 0.2 }]} />
                    <Text style={[{ color: theme.textUnchangeable, opacity: 0.8 }, Typography.regular15_20]}>
                        {t('products.holders.otpBanner.expired')}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.timer}>
            <View style={styles.timerItem}>
                <View style={styles.timerItemBack} />
                <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold15_20]}>
                    {minutes.toString().padStart(2, '0')}
                </Text>
            </View>
            <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold15_20]}>
                :
            </Text>
            <View style={styles.timerItem}>
                <View style={styles.timerItemBack} />
                <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold15_20]}>
                    {seconds.toString().padStart(2, '0')}
                </Text>
            </View>
        </View>
    );
});

const onOtpAnswer = ({ id, accept, token, isTestnet, address }: { id: string, accept: boolean, token: string, isTestnet: boolean, address: string }) => (async () => {
    try {
        await fetchOtpAnswer({ id, accept, token, isTestnet });
        queryClient.invalidateQueries(Queries.Holders(address).OTP());
    } catch { }
});

const OtpAction = memo((
    { id, accept, address, setActionDisabled, disabled }:
        { id: string, accept: boolean, address: string, setActionDisabled: (disabled: boolean) => void, disabled: boolean }
) => {
    const navigation = useTypedNavigation();
    const { isTestnet } = useNetwork();
    const url = holdersUrl(isTestnet);
    const [lockAppWithAuth] = useLockAppWithAuthState();

    const [loading, setLoading] = useState(false);

    const onNoTokenFound = () => {
        navigation.navigateHoldersLanding({ endpoint: url, onEnrollType: { type: HoldersAppParamsType.Create } }, isTestnet);
    };

    const answer = async () => {
        if (loading || disabled) {
            return;
        }
        setLoading(true);
        try {
            const token = getHoldersToken(address);
            // should not happen
            if (!token) {
                onNoTokenFound();
                return;
            }

            const callback = onOtpAnswer({ id, accept, token, isTestnet, address });

            if (!lockAppWithAuth) {
                navigation.navigateMandatoryAuthSetup({ callback });
                return;
            }

            await onOtpAnswer({ id, accept, token, isTestnet, address })();
        } catch { } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setActionDisabled(loading);
    }, [loading]);

    const icon = accept ? AcceptIcon : DeclineIcon;
    const textColor = accept ? '#000' : '#fff';
    const title = accept ? t('products.holders.otpBanner.accept') : t('products.holders.otpBanner.decline');

    return (
        <Pressable
            disabled={loading || disabled}
            style={({ pressed }) => [
                styles.action,
                { opacity: pressed ? 0.8 : 1 }
            ]}
            onPress={answer}
        >
            <View style={accept ? styles.actionAccept : styles.actionDecline} />
            {loading ? <ActivityIndicator color={textColor} size='small' /> : icon}
            <Text style={[{ color: textColor }, Typography.semiBold15_20]}>
                {title}
            </Text>
        </Pressable>
    );
});

function expired(expireAt: Date | null) {
    if (!expireAt) {
        return true;
    }
    return expireAt.getTime() < Date.now();
}

export const PaymentOtpBanner = memo(({ address }: { address: Address }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const otp = useHoldersOtp(address, isTestnet);
    const addressString = address.toString({ testOnly: isTestnet });
    const [actionDisabled, setActionDisabled] = useState(false);

    let expiresAt: Date | null = null;

    if (otp && otp.expiresAt) {
        try {
            expiresAt = new Date(otp.expiresAt);
        } catch (error) { }
    }

    const [hasExpired, setHasExpired] = useState(expired(expiresAt));

    const onExpired = () => {
        queryClient.invalidateQueries(Queries.Holders(addressString).OTP());
        setHasExpired(true);
    }

    useEffect(() => {
        const isOtpExpired = expired(expiresAt);
        if (!isOtpExpired) {
            setHasExpired(false);
        }
    }, [expiresAt]);

    const isUsed = otp?.status !== 'PENDING';
    const isValid = !!otp && otp.type === 'confirmation_request';

    if (!isValid || isUsed || hasExpired) {
        return null;
    }

    let message = `${otp.amount} ${otp.currency}`;

    if (otp.merchant) {
        message += ` ${otp.merchant.cleanName ?? otp.merchant.dirtyName}`;
    }

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
            style={styles.container}
        >
            <LinearGradient
                style={styles.gradient}
                colors={gradientColors}
                start={[0, 1]}
                end={[1, 0]}
            />
            <View style={styles.body}>
                <View>
                    <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold17_24]}>
                        {t('products.holders.otpBanner.title')}
                    </Text>
                    <Text style={[{ color: theme.textUnchangeable, opacity: 0.8 }, Typography.regular15_20]}>
                        {message}
                    </Text>
                </View>
                {expiresAt && <OtpTimer expireAt={expiresAt} onExpired={onExpired} />}
            </View>
            <View style={styles.actions}>
                <OtpAction
                    id={otp.txnId}
                    accept
                    address={addressString}
                    disabled={actionDisabled}
                    setActionDisabled={setActionDisabled}
                />
                <OtpAction
                    id={otp.txnId}
                    accept={false}
                    address={addressString}
                    disabled={actionDisabled}
                    setActionDisabled={setActionDisabled}
                />
            </View>
        </Animated.View>
    );
});

PaymentOtpBanner.displayName = "PaymentOtpBanner";

const styles = StyleSheet.create({
    container: { borderRadius: 20, padding: 20, gap: 20, margin: 20, marginBottom: 0 },
    gradient: {
        position: 'absolute',
        borderRadius: 20,
        left: 0, right: 0,
        top: 0, bottom: 0
    },
    body: { flexDirection: 'row', gap: 16, justifyContent: 'space-between', alignItems: 'center' },
    timer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start'
    },
    timerItem: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
        minWidth: 40,
    },
    timerItemBack: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        opacity: 0.16, borderRadius: 8,
        backgroundColor: '#fff'
    },
    actions: { flexDirection: 'row', gap: 12, justifyContent: 'space-evenly', alignItems: 'center', width: '100%' },
    action: { flexDirection: 'row', gap: 4, paddingVertical: 8, borderRadius: 200, flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    actionAccept: { backgroundColor: '#fff', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
    actionDecline: { backgroundColor: '#fff', opacity: 0.16, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }
});
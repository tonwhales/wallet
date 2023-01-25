import { StatusBar } from "expo-status-bar";
import React, { useLayoutEffect, useRef } from "react";
import { View, Text, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { useEngine } from "../../engine/Engine";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import LottieView from 'lottie-react-native';
import { JettonProduct } from "../../components/products/JettonProduct";
import { ProductButton } from "../../components/products/ProductButton";
import TonIcon from '../../../assets/ic_ton_account.svg';
import BN from "bn.js";
import { SearchBar } from '@rneui/themed';

export const AccountsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const engine = useEngine();
    const navigation = useTypedNavigation();
    const jettons = engine.products.main.useJettons();
    const active = jettons.filter((j) => !j.disabled);
    const account = engine.products.main.useAccount();

    // 
    // Lottie animation
    // 
    const anim = useRef<LottieView>(null);
    useLayoutEffect(() => {
        if (Platform.OS === 'ios') {
            setTimeout(() => {
                anim.current?.play()
            }, 300);
        }
    }, []);

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('products.accounts')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('products.accounts')}
                    </Text>
                </View>
            )}
            {jettons.length === 0 && (
                <View style={{
                    paddingHorizontal: 16,
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <LottieView
                        ref={anim}
                        source={require('../../../assets/animations/empty.json')}
                        autoPlay={true}
                        loop={true}
                        style={{ width: 128, height: 128, maxWidth: 140, maxHeight: 140 }}
                    />
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        marginBottom: 8,
                        textAlign: 'center',
                        color: Theme.textColor,
                    }}
                    >
                        {t('accounts.noAccounts')}
                    </Text>
                </View>
            )}
            {jettons.length > 0 && (
                <>
                    <SearchBar
                        platform={Platform.OS === 'android' ? 'android' : 'ios'}
                        containerStyle={{
                            backgroundColor: Platform.OS === 'ios'
                                ? 'transparent'
                                : undefined,
                            height: Platform.OS === 'ios' ? 36 : 42,
                            paddingHorizontal: 8,
                            marginTop: 24
                        }}
                        inputContainerStyle={{
                            height: 36,
                            // backgroundColor: searchBarBackgroundColor
                            //     ? searchBarBackgroundColor
                            //     : inputContainerColors,
                            borderRadius: 8,

                        }}
                        returnKeyType="search"
                        inputStyle={{
                            fontSize: Platform.OS === 'ios' ? undefined : 14,
                            // color: colors.backgroundText,
                        }}
                        cancelIcon={false}
                        placeholder={t('common.search')}
                    // placeholderTextColor={colors.toolBarIcon}
                    // searchIcon={() => <IconElement
                    //     name={'md-search'}
                    //     collection={'ionicons'}
                    //     color={colors.toolBarIcon}
                    //     size={16}
                    // />}
                    // cancelButtonProps={{
                    //     color: Platform.OS === 'ios'
                    //         ? colors.accent
                    //         : colors.toolBarIcon
                    // }}
                    // value={search ? search : ''}
                    // showLoading={loading}
                    // onChangeText={setSearch}
                    // onClear={() => setSearch('')}
                    // onSubmitEditing={() => {
                    //     if (onSubmitEditing) onSubmitEditing(search ? search : '');
                    //     setSearch(search ? search : '');
                    // }}
                    // onCancel={() => { if (onCancel) onCancel() }}
                    />
                    <ScrollView style={{ flexGrow: 1 }}>
                        <View style={{
                            marginBottom: 16,
                            marginTop: 24,
                            borderRadius: 14,
                            flexShrink: 1,
                        }}>
                            <ProductButton
                                key={'ton'}
                                name={'TON'}
                                subtitle={'The Open Network'}
                                icon={TonIcon}
                                value={account?.balance ?? new BN(0)}
                                onPress={() => {
                                    navigation.navigateSimpleTransfer({ amount: null, target: null, stateInit: null, job: null, comment: null, jetton: null, callback: null })
                                }}
                                symbol={'TON'}
                                style={{ marginVertical: 4 }}
                            />
                            {active.map((j) => {
                                return (
                                    <JettonProduct
                                        key={'jt' + j.wallet.toFriendly()}
                                        jetton={j}
                                        navigation={navigation}
                                        engine={engine}
                                    />
                                );
                            })}
                        </View>
                    </ScrollView>
                </>
            )}
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
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

    // const items = useMemo(() => {
    //     return active.map((j) => {
    //         return {
    //             name: j.name,
    //             icon: j.icon,
    //             onPress: () => {
    //                 navigation.navigate('Jetton', { jetton: j });
    //             }
    //         }
    //     });
    // }, [active]);

    // const [searchText, setSearchText] = useState("");
    // // TODO fix this hack
    // const [showTon, setShowTon] = useState(true);
    // const [filteredItems, setFilteredItems] = useState([]);

    // const handleSearch = useCallback((text) => {
    //     setSearchText(text);
    //     const filtered = items.filter((i) =>  i.name.toLowerCase().includes(text.toLowerCase()));
    //     setFilteredItems(filtered);
    // }, [items]);

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('products.crypto')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('products.crypto')}
                    </Text>
                </View>
            )}
            {jettons.length > 1 && (
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
                        value={searchText}
                        // showLoading={loading}
                        onChangeText={handleSearch}
                        onClear={() => handleSearch('')}
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
                                    navigation.navigateSimpleTransfer({
                                        amount: null,
                                        target: null,
                                        stateInit: null,
                                        job: null,
                                        comment: null,
                                        jetton: null,
                                        callback: null
                                    })
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
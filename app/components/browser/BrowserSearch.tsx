import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Platform, useWindowDimensions, Pressable } from "react-native";
import { ThemeType } from "../../engine/state/theme";
import { ATextInput } from "../ATextInput";
import { t } from "../../i18n/t";
import { extractDomain } from "../../engine/utils/extractDomain";
import { Typography } from "../styles";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { normalizeUrl } from "../../utils/resolveUrl";
import axios from "axios";
import { useToaster } from "../toast/ToastProvider";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Image } from 'expo-image';
import { ItemDivider } from "../ItemDivider";
import { BrowserSearchSuggestion } from "../../engine/hooks/dapps/useDAppsSuggestions";
import { useWebSearchSuggestions } from "../../engine/hooks/dapps/useWebSearchSuggestions";
import { SearchEngine } from "../../engine/state/searchEngine";
import { LoadingIndicator } from "../LoadingIndicator";
import { useKeyboard } from "@react-native-community/hooks";
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel";

async function checkUrlReachability(url: string) {
    try {
        await axios.head(url, { timeout: 5000 });
        return true;
    } catch {
        return false;
    }
};

export const SearchSuggestionItem = memo(({
    item,
    itemHeight,
    theme,
    onSelect,
    index,
    disabled
}: {
    item: BrowserSearchSuggestion,
    itemHeight: number,
    theme: ThemeType,
    onSelect: (url: string) => Promise<void>,
    index: number,
    disabled?: boolean
}) => {
    const [loading, setLoading] = useState(false);

    const action = useCallback(async () => {
        setLoading(true);
        await onSelect(item.url);
        setLoading(false);
    }, [item.url, onSelect]);

    return (
        <View>
            {index !== 0 && (<ItemDivider marginHorizontal={0} marginVertical={2} />)}
            <Pressable
                style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1
                })}
                disabled={disabled}
                onPress={action}
            >
                <View
                    style={{ height: itemHeight, alignItems: 'center', flexDirection: 'row', gap: 8 }}
                >
                    {(item.source === 'dapp') ? (
                        <Image
                            source={{ uri: item.icon }}
                            style={{ width: 38, height: 38, borderRadius: 38 }}
                            placeholder={require('@assets/ic_app_placeholder.png')}
                            placeholderContentFit={'contain'}
                        />
                    ) : (
                        <View style={{
                            width: 38, height: 38,
                            borderRadius: 38,
                            backgroundColor: theme.white,
                            justifyContent: 'center', alignItems: 'center'
                        }}>
                            <Image
                                source={require('@assets/ic-explorer.png')}
                                style={{ width: 28, height: 28 }}
                                placeholderContentFit={'contain'}
                            />
                        </View>
                    )}
                    <Text
                        style={[
                            { color: theme.textPrimary, flexGrow: 1, flexShrink: 1 },
                            Typography.medium15_20
                        ]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                    >
                        {item?.title}
                    </Text>
                    {loading && (<LoadingIndicator simple />)}
                </View>
            </Pressable>
        </View>
    );
});

export const SearchSuggestions = memo(({
    theme,
    onSelect,
    suggestions,
    searchEngine,
    lockSelection
}: {
    theme: ThemeType,
    onSelect: (url: string) => Promise<void>,
    suggestions: {
        dapps: BrowserSearchSuggestion[],
        web: BrowserSearchSuggestion[]
    },
    searchEngine: SearchEngine,
    lockSelection?: boolean
}) => {
    const itemHeight = 48;
    const dimensions = useWindowDimensions();
    const heightValue = useSharedValue(0);
    const keyboard = useKeyboard();

    const animSearchStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(heightValue.value, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
            shadowColor: theme.textPrimary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 4
        };
    });

    useEffect(() => {
        const suggestionsLength = [...suggestions.dapps, ...suggestions.web].length;
        const contentHeight = suggestionsLength * (itemHeight + 18) + 24 + 16;
        const maxHeight = keyboard.keyboardShown
            ? (dimensions.height / 2) - 56 - 8
            : dimensions.height - 256;
        const toExpandTo = (contentHeight > maxHeight) ? maxHeight : contentHeight;
        heightValue.value = suggestionsLength > 0 ? toExpandTo : 0;
    }, [suggestions, keyboard.keyboardShown]);

    return (
        <Animated.View style={[{
            position: 'absolute',
            left: 16, right: 16, top: 46,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            backgroundColor: theme.border,
            zIndex: 1001,
        }, animSearchStyle]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, padding: 16 }}
                keyboardShouldPersistTaps={'always'}
            >
                {suggestions.dapps.map((item, index) => (
                    <SearchSuggestionItem
                        index={index}
                        key={`suggestion-dapp-${index}`}
                        item={item}
                        itemHeight={itemHeight}
                        theme={theme}
                        onSelect={onSelect}
                        disabled={lockSelection}
                    />
                ))}
                {suggestions.dapps.length > 0 && suggestions.web.length > 0 && (
                    <ItemDivider marginHorizontal={0} marginVertical={2} />
                )}
                {suggestions.web.length > 0 && (
                    <Text style={[{ color: theme.textSecondary }, Typography.semiBold17_24]}>
                        {t('browser.search.suggestions.web', { engine: t(`browser.search.suggestions.${searchEngine}`) })}
                    </Text>
                )}
                {suggestions.web.map((item, index) => (
                    <SearchSuggestionItem
                        index={index}
                        key={`suggestion-web-${index}`}
                        item={item}
                        itemHeight={itemHeight}
                        theme={theme}
                        onSelect={onSelect}
                        disabled={lockSelection}
                    />
                ))}
            </ScrollView>
        </Animated.View>
    );
});

export const BrowserSearch = memo(({
    theme,
    navigation,
    isTestnet
}: {
    theme: ThemeType,
    navigation: TypedNavigation,
    isTestnet: boolean
}) => {
    const searchRef = useRef<string>('');
    const [search, setSearch] = useState(searchRef.current);
    const toaster = useToaster();
    const bottomBarHeight = useBottomTabBarHeight();
    const { suggestions, getSuggestions, searchEngine } = useWebSearchSuggestions(search);
    const [lockSelection, setLockSelection] = useState(false);

    const onSetSearch = useCallback((text: string) => {
        setSearch(text);
        searchRef.current = text;
    }, []);

    const onSearch = useCallback(async (text: string) => {

        if (!text) {
            return;
        }

        // Lock selection to prevent multiple navigations
        setLockSelection(true);

        let url = normalizeUrl(text);
        const currentSuggestions = getSuggestions();

        if (!url) {
            toaster.show({ type: 'error', message: t('browser.search.invalidUrl'), marginBottom: Platform.select({ ios: bottomBarHeight + 16, android: 16 }) });
            return;
        }

        const reachable = await checkUrlReachability(url);

        if (!reachable) {
            if (currentSuggestions.length !== 0) {
                url = currentSuggestions[0].url;
            } else {
                setLockSelection(false)
                toaster.show({
                    type: 'error', message: t('browser.search.urlNotReachable'), marginBottom: Platform.select({ ios: bottomBarHeight + 16, android: 16 })
                });
                return;
            }
        }

        const domain = extractDomain(url);

        setLockSelection(false);

        trackEvent(MixpanelEvent.BrowserSearch, { url, query: searchRef.current }, isTestnet);

        navigation.navigateDAppWebView({
            url,
            header: { title: { type: 'params', params: { domain } } },
            useStatusBar: true,
            engine: 'ton-connect',
            refId: 'tonhub-search',
            controlls: {
                refresh: true,
                share: true,
                back: true,
                forward: true
            },
            safeMode: true,
            lockNativeBack: true
        });

        // Reset search
        onSetSearch('');
    }, []);

    const animBorderRadius = useSharedValue(20);

    useEffect(() => {
        const suggestionsLength = [...suggestions.dapps, ...suggestions.web].length;
        animBorderRadius.value = suggestionsLength > 0 ? 0 : 20;
    }, [[...suggestions.dapps, ...suggestions.web].length]);

    const animStyle = useAnimatedStyle(() => {
        return {
            borderBottomLeftRadius: withTiming(animBorderRadius.value, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
            borderBottomRightRadius: withTiming(animBorderRadius.value, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        };
    });

    return (
        <View style={{ marginBottom: 16 }}>
            <Animated.View style={[{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                marginHorizontal: 16,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                backgroundColor: theme.border,
                shadowColor: theme.textPrimary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 4
            }, animStyle]}>
                <Ionicons name={'search'} size={24} color={theme.iconNav} />
                <ATextInput
                    index={0}
                    style={{ marginHorizontal: 16, flex: 1 }}
                    onValueChange={onSetSearch}
                    editable={!lockSelection}
                    onSubmit={() => onSearch(search)}
                    keyboardType={'web-search'}
                    inputMode={'search'}
                    textContentType={'URL'}
                    placeholder={t('browser.search.placeholder')}
                    returnKeyType={'go'}
                    value={search}
                    cursorColor={theme.accent}
                    autoCapitalize={'none'}
                />
                {lockSelection && (<LoadingIndicator style={{ position: 'absolute', top: 0, bottom: 0, right: 16 }} simple />)}
            </Animated.View>
            <SearchSuggestions
                theme={theme}
                onSelect={onSearch}
                suggestions={suggestions}
                searchEngine={searchEngine}
                lockSelection={lockSelection}
            />
        </View>
    );
});
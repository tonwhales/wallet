import { useDimensions } from "@react-native-community/hooks";
import { createContext, useContext, useRef, useState } from "react";
import { Pressable, View, Text, ScrollView } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography } from "../../components/styles";
import { useTheme } from "../../engine/hooks";
import Collapsible from "react-native-collapsible";
import { ItemDivider } from "../../components/ItemDivider";
import { storage } from "../../storage/storage";
import { Ionicons } from '@expo/vector-icons';
import { formatTime } from "../dates";

// TODO: remove before pushing to prod
const storedItemsKey = 'debug-items';

export function getStoredDebugItems() {
    const storedItems = storage.getString(storedItemsKey);
    if (!storedItems) {
        return [];
    }
    return JSON.parse(storedItems);
}

export function storeDebugItems(items: string[]) {
    storage.set(storedItemsKey, JSON.stringify(items));
}

export function storeDebugItem(item: string) {
    const items = getStoredDebugItems();

    const milliseconds = Date.now();
    const currentTime = milliseconds / 1000;
    const hourMinuteSeconds = formatTime(currentTime);
    const millisecondsString = milliseconds.toString().slice(-3);
    const toStore = `${hourMinuteSeconds}:${millisecondsString}: ${item}`;

    items.push(toStore);
    storeDebugItems(items);
}

const DebugContext = createContext<{
    addEvent: (event: string) => void;
    clearEvents: () => void;
    showDebug: () => void;
    hideDebug: () => void;
    isVisible: boolean;
} | null>(null);

export function useDebugContext() {
    const context = useContext(DebugContext);
    if (!context) {
        throw new Error('useDebugContext must be used within a DebugContextProvider');
    }
    return context;
}

export const DebugContextProvider = ({ children }: { children: any }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [collapsed, setCollapsed] = useState(true);
    const [events, setEvents] = useState<string[]>(getStoredDebugItems());

    const eventsRef = useRef(events);

    const addEvent = (event: string) => {
        const currentTime = new Date().toLocaleTimeString();
        const hourMinuteSeconds = currentTime.split(' ')[0];

        eventsRef.current.push(`${hourMinuteSeconds}: ${event}`);
        setEvents(eventsRef.current);
    };

    const clearEvents = () => {
        eventsRef.current = [];
        setEvents(eventsRef.current);
        storeDebugItems(eventsRef.current);
    };

    const refreshEvents = () => {
        setEvents(getStoredDebugItems());
    };

    const showDebug = () => {
        setIsVisible(true);
    }
    const hideDebug = () => {
        setIsVisible(false);
    }

    const safeArea = useSafeAreaInsets();
    const theme = useTheme();

    const offsetX = useSharedValue<number>(0);
    const offsetY = useSharedValue<number>(safeArea.top);
    const width = useDimensions().window.width;

    const isDragging = useSharedValue(false);

    const longPressGesture = Gesture.LongPress()
        .onStart(() => {
            isDragging.value = true;
        })
        .minDuration(250);

    const drag = Gesture.Pan()
        .manualActivation(true)
        .onTouchesMove((_e, state) => {
            if (isDragging.value) {
                state.activate();
            } else {
                state.fail();
            }
        })
        .onChange((event) => {
            offsetX.value += event.changeX;
            offsetY.value += event.changeY;
        })
        .onFinalize(() => {
            isDragging.value = false;
        })
        .simultaneousWithExternalGesture(longPressGesture);

    const composedGesture = Gesture.Race(drag, longPressGesture);

    const animatedStyles = useAnimatedStyle(() => ({
        left: offsetX.value + 16,
        top: safeArea.top + offsetY.value,
    }));

    return (
        <DebugContext.Provider value={{
            addEvent,
            clearEvents,
            showDebug,
            hideDebug,
            isVisible
        }}>
            {children}
            {isVisible && (
                <Animated.View style={[{ position: 'absolute' }, animatedStyles]}>
                    <GestureDetector gesture={composedGesture}>
                        <View style={{
                            backgroundColor: theme.elevation,
                            padding: 16,
                            borderRadius: 20, borderWidth: 1, borderColor: theme.warning,
                            justifyContent: 'center', alignItems: 'center',
                            width: width - 64,
                        }}>
                            <View style={{ marginBottom: 16, gap: 8, flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                                <Pressable
                                    onPress={() => {
                                        setCollapsed((prev) => !prev);
                                    }}
                                    style={({ pressed }) => ({
                                        justifyContent: 'center', alignItems: 'center',
                                        opacity: pressed ? 0.5 : 1
                                    })}
                                >
                                    <Text style={[Typography.semiBold15_20, { color: theme.textPrimary }]}>
                                        {collapsed ? 'Show debug' : 'Hide debug'}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => {
                                        clearEvents();
                                    }}
                                    style={({ pressed }) => ({
                                        justifyContent: 'center', alignItems: 'center',
                                        opacity: pressed ? 0.5 : 1
                                    })}
                                >
                                    <Text style={[Typography.semiBold15_20, { color: theme.textPrimary }]}>
                                        {'Clear events'}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={({ pressed }) => ({
                                        padding: 8,
                                        justifyContent: 'center', alignItems: 'center',
                                        opacity: pressed ? 0.5 : 1
                                    })}
                                    onPress={refreshEvents}
                                >
                                    <Ionicons
                                        name={'refresh'}
                                        size={24}
                                        color={theme.iconNav}
                                    />
                                </Pressable>
                                <Pressable
                                    style={({ pressed }) => ({
                                        padding: 8,
                                        justifyContent: 'center', alignItems: 'center',
                                        opacity: pressed ? 0.5 : 1
                                    })}
                                    onPress={hideDebug}
                                >
                                    <Ionicons
                                        name={'close-circle-outline'}
                                        size={24}
                                        color={theme.iconNav}
                                    />
                                </Pressable>
                            </View>
                            {!collapsed && (
                                <ItemDivider />
                            )}
                            <Collapsible collapsed={collapsed}>
                                <ScrollView
                                    style={{
                                        maxHeight: 300,
                                        maxWidth: width - 32,
                                        backgroundColor: theme.elevation,
                                    }}
                                    contentContainerStyle={{ padding: 8 }}
                                >
                                    {events.map((event, index) => (
                                        <View key={index} style={{ padding: 8 }}>
                                            <Text style={[Typography.regular15_20, { color: theme.textPrimary }]}>
                                                {event}
                                            </Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </Collapsible>
                        </View>
                    </GestureDetector>
                </Animated.View>
            )}
        </DebugContext.Provider>
    );
};
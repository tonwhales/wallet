import * as React from 'react';
import { Page } from '../../components/Page';
import { fragment } from '../../fragment';
import { BleManager, Device, State } from 'react-native-ble-plx';
import { Text, View } from 'react-native';
import { Item } from '../../components/Item';

export const DevBluetoothFragment = fragment(() => {
    const manager = React.useMemo(() => new BleManager(), []);
    const [devices, setDevices] = React.useState<Device[]>([]);
    const [state, setState] = React.useState<State>(State.Unknown);
    React.useEffect(() => {
        let exited = false;
        let callback: (() => void) | null = null;
        (async () => {
            let s = await manager.state();
            if (exited) {
                return;
            }
            setState(s);
            let c = manager.onStateChange((state) => {
                setState(state);
            });
            callback = () => c.remove();
        })();
        return () => {
            exited = true;
            if (callback) {
                callback();
            }
        }
    }, []);

    React.useEffect(() => {
        if (state === State.PoweredOn) {
            manager.startDeviceScan(null, null, (e, d) => {
                if (d && d.name && d.isConnectable) {
                    console.warn(d);
                    setDevices((src) => {
                        if (src.findIndex((v) => v.id === d.id) < 0) {
                            return [...src, d];
                        } else {
                            return src;
                        }
                    });
                }
            });
            return () => manager.stopDeviceScan();
        } else {
            setDevices([]);
        }
    }, [state]);

    return (
        <Page>
            <Text>{state.toString()}</Text>
            {devices.map((v) => (
                <View>
                    <Item title={v.name!} />
                </View>
            ))}
        </Page>
    );
});
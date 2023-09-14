import * as React from 'react';
import { Image } from 'react-native';

export function AppLogo() {
    return <Image source={require('@assets/logo.png')} style={{ width: 256, height: 256 }} resizeMode="cover" />
}
import * as React from 'react';
import { LoadingIndicator } from './LoadingIndicator';

export const Deferred = React.memo((props: { enable?: boolean, children?: any }) => {
    const [render, setRender] = React.useState(typeof props.enable === 'boolean' ? !props.enable : false);
    React.useEffect(() => {
        let ended = false;
        setTimeout(() => {
            if (!ended) {
                setRender(true);
            }
        }, 30);
        return () => {
            ended = true;
        }
    }, []);
    if (!render) {
        return (
            <LoadingIndicator simple={true} />
        );
    } else {
        return (
            <>
                {props.children}
            </>
        )
    }
});
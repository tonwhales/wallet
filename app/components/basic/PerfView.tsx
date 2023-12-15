// By rendering directly to the inner RCTView, we avoid an extra level of rendering depth.
// Typically, you'd render a View, which is a plain JavaScript React component that transforms a few props.
// However, by rendering directly to the inner RCTView, React can skip one component resolution step,

import { NativeMethods, ViewComponent } from "react-native"

// which can improve performance.
type Constructor<T> = new (...args: any[]) => T
export const PerfView: Constructor<NativeMethods> & typeof ViewComponent = require('react-native/Libraries/Components/View/ViewNativeComponent').default

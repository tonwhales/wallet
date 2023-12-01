// By rendering directly to the inner RCTView, we avoid an extra level of rendering depth.
// Typically, you'd render a View, which is a plain JavaScript React component that transforms a few props.
// However, by rendering directly to the inner RCTView, React can skip one component resolution step,
// which can improve performance.
export const PerfView = require('react-native/Libraries/Components/View/ViewNativeComponent').default

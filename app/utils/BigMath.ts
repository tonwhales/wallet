export const BigMath = {
    abs(x: bigint) {
      return x < 0n ? -x : x
    },
    neg(x: bigint) {
        return x > 0n ? -x : x
    },
    sign(x: bigint) {
      if (x === 0n) return 0n
      return x < 0n ? -1n : 1n
    },
    pow(base: bigint, exponent: bigint) {
      return base ** exponent
    },
    min(value: bigint, ...values: bigint[]) {
      for (const v of values)
        if (v < value) value = v
      return value
    },
    max(value: bigint, ...values: bigint[]) {
      for (const v of values)
        if (v > value) value = v
      return value
    },
  }
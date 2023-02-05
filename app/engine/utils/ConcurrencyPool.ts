import { BoundedConcurrencyPool } from "teslabot";

export class OffloadedBoundedConcurrencyPool extends BoundedConcurrencyPool {
  run<T>(src: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        super.run(src).then(resolve).catch(reject);
      }, 50);
    });
  }
}

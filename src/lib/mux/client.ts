import Mux from "@mux/mux-node";

let _mux: Mux | null = null;

export function getMux() {
  if (!_mux) {
    _mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });
  }
  return _mux;
}

// Backward-compatible named export
export const mux = new Proxy({} as Mux, {
  get(_target, prop, receiver) {
    const m = getMux();
    const value = Reflect.get(m, prop, receiver);
    if (typeof value === "function") {
      return value.bind(m);
    }
    return value;
  },
});

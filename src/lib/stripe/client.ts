import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

// Backward-compatible named export
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const s = getStripe();
    const value = Reflect.get(s, prop, receiver);
    if (typeof value === "function") {
      return value.bind(s);
    }
    return value;
  },
});

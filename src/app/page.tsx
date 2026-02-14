import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Video,
  DollarSign,
  Lock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4 lg:px-8">
        <div className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-brand-600" />
          <span className="text-xl font-bold text-brand-900">
            ConstructShield
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm text-brand-700">
            <Shield className="h-4 w-4" />
            Protected by $1M Guarantee
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Build with confidence.{" "}
            <span className="text-brand-600">Pay with trust.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            ConstructShield is the construction marketplace that prevents fraud
            through video-verified milestone payments and secure escrow. Every
            dollar is protected until the work is proven.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Your Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contractors">Browse Contractors</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            How ConstructShield Protects You
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3 rounded-xl border bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
                <DollarSign className="h-5 w-5 text-brand-700" />
              </div>
              <h3 className="text-lg font-semibold">Escrow Protection</h3>
              <p className="text-sm text-muted-foreground">
                Funds are held in secure escrow until each milestone is verified.
                No work, no payment. No payment without proof.
              </p>
            </div>
            <div className="space-y-3 rounded-xl border bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-trust-green/10">
                <Video className="h-5 w-5 text-trust-green" />
              </div>
              <h3 className="text-lg font-semibold">Video Verification</h3>
              <p className="text-sm text-muted-foreground">
                Contractors upload video proof of completed milestones. You see
                the work before you release the funds.
              </p>
            </div>
            <div className="space-y-3 rounded-xl border bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-amber/10">
                <Lock className="h-5 w-5 text-warning-amber" />
              </div>
              <h3 className="text-lg font-semibold">Leakage Protection</h3>
              <p className="text-sm text-muted-foreground">
                Our system prevents off-platform payments and contact sharing to
                keep every transaction protected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-t px-4 py-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <h3 className="text-xl font-semibold">Why builders trust us</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              "Licensed Verification",
              "Milestone Payments",
              "Video Proof Required",
              "Dispute Resolution",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 shrink-0 text-trust-green" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            ConstructShield
          </div>
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

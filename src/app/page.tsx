import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { NearByCTA } from "@/components/location/nearby-cta";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

const categoryKeys = [
  "landing.residential",
  "landing.commercial",
  "landing.renovation",
  "landing.infrastructure",
  "landing.interior",
  "landing.landscaping",
] as const;

const trustKeys = [
  "landing.licensedVerification",
  "landing.milestonePayments",
  "landing.videoProofRequired",
  "landing.disputeResolution",
] as const;

export default async function LandingPage() {
  const t = await getTranslations();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex h-20 items-center justify-between px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo.png"
            alt="ConstructShield"
            width={32}
            height={32}
            className="md:hidden"
          />
          <span className="hidden text-sm font-bold uppercase tracking-[0.3em] md:inline">
            {t("common.constructshield")}
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <LanguageSwitcher />
          <Link
            href="/contractors"
            className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("landing.contractors")}
          </Link>
          <Link
            href="/login"
            className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("auth.signIn")}
          </Link>
          <Link
            href="/signup"
            className="border border-foreground px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] transition-colors hover:bg-foreground hover:text-background"
          >
            {t("landing.getStarted")}
          </Link>
        </nav>
        <div className="flex items-center gap-4 md:hidden">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="text-xs font-medium uppercase tracking-[0.2em]"
          >
            {t("auth.signIn")}
          </Link>
          <Link
            href="/signup"
            className="border border-foreground px-4 py-2 text-xs font-medium uppercase tracking-[0.2em]"
          >
            {t("landing.start")}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 px-6 lg:px-12">
        <div className="grid flex-1 items-center gap-12 lg:grid-cols-2">
          {/* Text */}
          <div className="space-y-8 py-24 lg:py-32">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              {t("landing.tagline")}
            </p>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
              {t("landing.headline1")}
              <br />
              {t("landing.headline2")}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              {t("landing.description")}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-3 border border-foreground px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] transition-colors hover:bg-foreground hover:text-background"
              >
                {t("landing.startProject")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/contractors"
                className="inline-flex items-center gap-3 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("landing.browseContractors")}
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="relative hidden h-full min-h-[500px] lg:block">
            <Image
              src="/images/hero-construction.jpg"
              alt="Construction site with modern building structure"
              fill
              className="object-cover"
              priority
              sizes="(min-width: 1024px) 50vw, 0vw"
            />
          </div>
        </div>
      </section>

      {/* Nearby Builders CTA */}
      <NearByCTA />

      {/* Category Pills */}
      <section className="border-t px-6 py-12 lg:px-12">
        <div className="flex flex-wrap gap-3">
          {categoryKeys.map((key) => (
            <span
              key={key}
              className="rounded-full border px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              {t(key)}
            </span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-t px-6 py-20 lg:px-12">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="text-4xl font-black tracking-tight lg:text-5xl">
              5%
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              {t("landing.platformFee")}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-black tracking-tight lg:text-5xl">
              €1M
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              {t("landing.guaranteeProtection")}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-black tracking-tight lg:text-5xl">
              100%
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              {t("landing.videoVerified")}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-black tracking-tight lg:text-5xl">
              24/7
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              {t("landing.escrowProtected")}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t px-6 py-20 lg:px-12">
        <div className="mb-16">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            {t("landing.howItWorks")}
          </p>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight lg:text-4xl">
            {t("landing.threeLayersProtection")}
          </h2>
        </div>
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-4 border-t pt-6">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              01
            </p>
            <h3 className="text-xl font-bold">
              {t("landing.escrowProtectionTitle")}
            </h3>
            <p className="leading-relaxed text-muted-foreground">
              {t("landing.escrowProtectionDesc")}
            </p>
          </div>
          <div className="space-y-4 border-t pt-6">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              02
            </p>
            <h3 className="text-xl font-bold">
              {t("landing.videoVerificationTitle")}
            </h3>
            <p className="leading-relaxed text-muted-foreground">
              {t("landing.videoVerificationDesc")}
            </p>
          </div>
          <div className="space-y-4 border-t pt-6">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              03
            </p>
            <h3 className="text-xl font-bold">
              {t("landing.leakageProtectionTitle")}
            </h3>
            <p className="leading-relaxed text-muted-foreground">
              {t("landing.leakageProtectionDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t px-6 py-20 lg:px-12">
        <div className="flex flex-wrap gap-x-12 gap-y-4">
          {trustKeys.map((key) => (
            <p
              key={key}
              className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
            >
              {t(key)}
            </p>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 lg:px-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="ConstructShield"
              width={24}
              height={24}
              className="md:hidden"
            />
            <p className="hidden text-xs font-medium uppercase tracking-[0.3em] md:block">
              {t("common.constructshield")}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {t("common.allRightsReserved")}
          </p>
        </div>
      </footer>
    </div>
  );
}

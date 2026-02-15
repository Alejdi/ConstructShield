import { SignupForm } from "@/components/auth/signup-form";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Sign Up - ConstructShield",
  description: "Create your ConstructShield account",
};

export default async function SignupPage() {
  const t = await getTranslations();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t("auth.createYourAccount")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.joinMarketplace")}
        </p>
      </div>
      <SignupForm />
    </div>
  );
}

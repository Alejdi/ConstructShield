import { LoginForm } from "@/components/auth/login-form";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Sign In - ConstructShield",
  description: "Sign in to your ConstructShield account",
};

export default async function LoginPage() {
  const t = await getTranslations();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t("auth.welcomeBack")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.signInToContinue")}
        </p>
      </div>
      <LoginForm />
    </div>
  );
}

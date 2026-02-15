"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useTranslations } from "next-intl";

const initialState: AuthState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const t = useTranslations();

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-danger-red/10 p-3 text-sm text-danger-red">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={t("auth.passwordPlaceholder")}
          required
          autoComplete="current-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t("auth.signingIn") : t("auth.signIn")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.dontHaveAccount")}{" "}
        <Link href="/signup" className="text-brand-600 hover:underline">
          {t("auth.signUp")}
        </Link>
      </p>
    </form>
  );
}

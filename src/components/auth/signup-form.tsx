"use client";

import { useActionState, useState } from "react";
import { signUp, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleSelector } from "./role-selector";
import Link from "next/link";
import { useTranslations } from "next-intl";

const initialState: AuthState = { error: null };

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);
  const [role, setRole] = useState<"client" | "contractor">("client");
  const t = useTranslations();

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-danger-red/10 p-3 text-sm text-danger-red">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label>{t("auth.iAmA")}</Label>
        <RoleSelector value={role} onChange={setRole} />
        <input type="hidden" name="role" value={role} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">{t("auth.fullName")}</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder={t("auth.fullNamePlaceholder")}
          required
          autoComplete="name"
        />
      </div>

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
          placeholder={t("auth.passwordMinChars")}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t("auth.creatingAccount") : t("auth.createAccount")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.alreadyHaveAccount")}{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </form>
  );
}

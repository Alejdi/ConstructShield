import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In - ConstructShield",
  description: "Sign in to your ConstructShield account",
};

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>
      <LoginForm />
    </div>
  );
}

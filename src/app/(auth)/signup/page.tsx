import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "Sign Up - ConstructShield",
  description: "Create your ConstructShield account",
};

export default function SignupPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Join the trusted construction marketplace
        </p>
      </div>
      <SignupForm />
    </div>
  );
}

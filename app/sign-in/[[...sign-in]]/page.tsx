import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <SignIn forceRedirectUrl="/applications/new" signUpUrl="/sign-up" />
      </div>
    </main>
  );
}

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <SignUp forceRedirectUrl="/applications/new" signInUrl="/sign-in" />
      </div>
    </main>
  );
}

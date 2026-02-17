import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-100">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-5xl font-semibold tracking-tight text-text-primary">obo</h1>
          <p className="text-text-secondary">On Behalf Of — Agentic API Governance</p>
        </div>

        <div className="flex justify-center">
          <SignIn />
        </div>
      </div>
    </div>
  );
}

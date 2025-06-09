import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          GrantDraftにログイン
        </h1>
        <p className="text-center text-gray-600 mb-8">
          メールアドレスを入力して、マジックリンクでログインしてください
        </p>
        <AuthForm />
      </div>
    </div>
  );
}
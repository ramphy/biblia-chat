import AuthForm from '@/app/components/auth-form'; // Adjust import path if needed

// This page will likely be a Server Component by default,
// but the AuthForm itself is a Client Component ('use client').
export default function AuthPage() {
  return <AuthForm />;
}

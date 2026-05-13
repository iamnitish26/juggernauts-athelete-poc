"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Trophy, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/athlete/register`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-600 text-sm mb-6">
            We sent a verification link to <strong>{email}</strong>. Click the link
            to verify your account and then complete your athlete registration.
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[#5B21B6] flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-[#3B0764] text-xl">
              Juggernauts Athlete ID
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Step 1 of 2 — Account setup
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Arjun Pradhan"
            />
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Min 8 characters"
              hint="At least 8 characters"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create Account
            </Button>
          </form>

          <p className="mt-4 text-xs text-gray-500 text-center leading-relaxed">
            By creating an account you agree to our data usage policy.
            Your private information will never be shared publicly.
          </p>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-[#5B21B6] font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

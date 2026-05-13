import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign In | Juggernauts Athlete ID",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <LoginForm />
    </Suspense>
  );
}

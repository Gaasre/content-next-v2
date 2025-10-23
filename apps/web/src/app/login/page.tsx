import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@content-next-v2/auth";
import LoginPageContent from "@/components/login-page-content";

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/dashboard");
  }

  return <LoginPageContent />;
}

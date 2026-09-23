"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isSocialPending, setIsSocialPending] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signInGithub = async () => {
    setIsSocialPending(true);
    await authClient.signIn.social(
      {
        provider: "github",
        callbackURL: "/",
      },
      {
        onError: () => {
          toast.error("Something went wrong");
          setIsSocialPending(false);
        },
      },
    );
  };

  const signInGoogle = async () => {
    setIsSocialPending(true);
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: "/",
      },
      {
        onError: () => {
          toast.error("Something went wrong");
          setIsSocialPending(false);
        },
      },
    );
  };

  const onSubmit = async (values: LoginFormValues) => {
    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          router.replace("/");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    );
  };

  const isPending = form.formState.isSubmitting || isSocialPending;

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="text-sm text-white/65">Sign in to continue to Gemezy</p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={signInGoogle}
          variant="outline"
          disabled={isPending}
          className="h-13 w-full rounded-xl border-white/20 bg-white/8 text-base font-semibold text-white hover:bg-white/15"
        >
          <Image alt="Google" src="/logos/google.svg" width={20} height={20} />
          Continue with Google
        </Button>

        <Button
          onClick={signInGithub}
          variant="outline"
          disabled={isPending}
          className="h-13 w-full rounded-xl border-white/20 bg-white/8 text-base font-semibold text-white hover:bg-white/15"
        >
          <Image alt="GitHub" src="/logos/github_light.svg" width={20} height={20} />
          Continue with GitHub
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/20" />
        <span className="text-xs font-medium uppercase text-white/50">
          Or continue with email
        </span>
        <div className="h-px flex-1 bg-white/20" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="m@example.com"
                    className="h-12 rounded-xl border-white/20 bg-white/8 text-white placeholder:text-white/40 focus-visible:border-white/50 focus-visible:ring-white/20"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="*********"
                    className="h-12 rounded-xl border-white/20 bg-white/8 text-white placeholder:text-white/40 focus-visible:border-white/50 focus-visible:ring-white/20"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isPending}
            className="h-13 w-full rounded-xl bg-emerald-400 text-base font-bold text-emerald-950 hover:bg-emerald-300"
          >
            Log in
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-white/70">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-bold text-white underline underline-offset-4">
          Sign up
        </Link>
      </div>

    </div>
  );
}
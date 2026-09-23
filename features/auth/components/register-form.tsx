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

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [socialPending, setSocialPending] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isPending = form.formState.isSubmitting || socialPending;

  const signInSocial = async (provider: "github" | "google") => {
    try {
      setSocialPending(true);
      await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
    } catch {
      toast.error(`Unable to continue with ${provider}`);
      setSocialPending(false);
    }
  };

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await authClient.signUp.email(
        {
          name: values.name,
          email: values.email,
          password: values.password,
          callbackURL: "/",
        },
        {
          onSuccess: () => {
            router.replace("/");
          },
          onError: (ctx) => {
            const message = (ctx?.error?.message ?? "").toLowerCase();
            const code = ctx?.error?.code ?? "";

            if (
              code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
              message.includes("already exists")
            ) {
              toast.error("Email already exists, login or use different email.");
              return;
            }

            toast.error(ctx.error.message);
          },
        },
      );
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String((error as { message?: string }).message ?? "")
          : "";

      if (
        message.toLowerCase().includes("already exists") ||
        message.toLowerCase().includes("422")
      ) {
        toast.error("Email already exists, login or use different email.");
        return;
      }

      toast.error("Something went wrong while creating your account.");
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Create your account
        </h1>
        <p className="text-sm text-white/65">Start organizing your world with Gemezy</p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => signInSocial("google")}
          className="h-13 w-full rounded-xl border-white/20 bg-white/8 text-base font-semibold text-white hover:bg-white/15"
        >
          <Image alt="Google" src="/logos/google.svg" width={20} height={20} />
          Continue with Google
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => signInSocial("github")}
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    autoComplete="name"
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="m@example.com"
                    autoComplete="email"
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
                    autoComplete="new-password"
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
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="*********"
                    autoComplete="new-password"
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
            {form.formState.isSubmitting ? "Creating account..." : "Sign up"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-white/70">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-white underline underline-offset-4">
          Login
        </Link>
      </div>
    </div>
  );
}
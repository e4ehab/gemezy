"use client";

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  useSuspenseProfile,
  useUpdateProfileName,
} from '@/features/profile/hooks/use-profile';
import {
  CalendarDaysIcon,
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
  MailIcon,
  MessageCircleIcon,
  UserRoundIcon,
} from 'lucide-react';
import { ProfileImageEditor } from '@/features/profile/components/profile-image-editor';
import { toast } from '@/components/ui/toast';
import {
  normalizeUsername,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '@/features/auth/username';

export function Profile() {
  const { data: profile } = useSuspenseProfile();
  const updateName = useUpdateProfileName();
  const [name, setName] = useState(profile.name);
  const createdAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
  }).format(profile.createdAt);
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `My Gemezy id: ->>>>             ${profile.publicId}`,
  )}`;

  const copyAccountId = async () => {
    await navigator.clipboard.writeText(profile.publicId);
    toast.success('Account ID copied');
  };

  const saveName = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const updatedName = normalizeUsername(name);

    if (
      updatedName.length < 2 ||
      !USERNAME_PATTERN.test(updatedName) ||
      updatedName === profile.name
    ) return;

    updateName.mutate(
      { name: updatedName },
      {
        onSuccess: ({ name: savedName }) => {
          setName(savedName);
          toast.success('Username updated');
        },
        onError: (error) =>
          toast.error(
            error.message.toLowerCase().includes('username is taken')
              ? 'Username is taken'
              : 'Could not update your username',
          ),
      },
    );
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:space-y-8 sm:p-6 md:p-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Account</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Profile</h1>
        <p className="text-muted-foreground">Your personal and account details.</p>
      </header>

      <section className="rounded-lg border bg-card p-4 text-card-foreground sm:p-6">
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <ProfileImageEditor image={profile.image} name={profile.name} />
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="truncate text-xl font-semibold sm:text-2xl">{profile.name}</h2>
            <p className="truncate text-muted-foreground">{profile.email}</p>
          </div>
          <Badge variant={profile.emailVerified ? 'default' : 'secondary'}>
            {profile.emailVerified ? <><CheckIcon /> Verified email</> : 'Email not verified'}
          </Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Account details</h2>
        <div className="divide-y rounded-lg border bg-card text-card-foreground">
          <form onSubmit={saveName} className="flex flex-wrap items-end gap-3 p-4">
            <UserRoundIcon className="mb-1 hidden size-5 text-muted-foreground sm:block" />
            <div className="w-full min-w-0 flex-1 space-y-1.5 sm:min-w-48">
              <label htmlFor="profile-name" className="text-sm text-muted-foreground">
                Username
              </label>
              <input
                id="profile-name"
                name="name"
                type="text"
                autoComplete="username"
                maxLength={USERNAME_MAX_LENGTH}
                required
                minLength={USERNAME_MIN_LENGTH}
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                disabled={updateName.isPending}
                className="min-h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9"
              />
              <p className="text-xs text-muted-foreground">
                Use letters, numbers, periods, or underscores. No spaces.
              </p>
            </div>
            <Button
              type="submit"
              className="min-h-11 w-full sm:w-auto"
              disabled={
                updateName.isPending ||
                name.length < USERNAME_MIN_LENGTH ||
                !USERNAME_PATTERN.test(name) ||
                normalizeUsername(name) === profile.name
              }
            >
            {updateName.isPending ? 'Saving...' : 'Save username'}
            </Button>
          </form>
          <div className="flex flex-wrap items-center gap-3 p-4">
            <KeyRoundIcon className="size-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Gemezy account ID</p>
              <p className="break-all font-mono font-medium">{profile.publicId}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 sm:size-8"
              title="Copy account ID"
              aria-label="Copy account ID"
              onClick={copyAccountId}
            >
              <CopyIcon />
            </Button>
            <a
              className={`${buttonVariants({ variant: 'outline' })} min-h-11 w-full sm:w-auto`}
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircleIcon />
              Share on WhatsApp
            </a>
          </div>
          <div className="flex min-w-0 items-start gap-3 p-4">
            <MailIcon className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email address</p>
              <p className="font-medium">{profile.email}</p>
            </div>
          </div>
          <div className="flex min-w-0 items-start gap-3 p-4">
            <CalendarDaysIcon className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Member since</p>
              <p className="font-medium">{createdAt}</p>
            </div>
          </div>
          <div className="flex min-w-0 items-start gap-3 p-4">
            <KeyRoundIcon className="size-5 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Sign-in methods</p>
              <p className="font-medium">
                {profile.accounts
                  .map(({ providerId }) => providerId === 'credential' ? 'Email and password' : providerId)
                  .join(', ') || 'No sign-in method available'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
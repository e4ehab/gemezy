import Image from "next/image";

export const AuthLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-black">
      <div className="pointer-events-none fixed inset-0">
        <Image
          src="/assets/login_1.jpeg"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/45 to-black/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0%,rgba(0,0,0,0.28)_70%)]" />
      </div>

      {/* Brand lockup */}
      <div className="fixed left-4 top-4 z-20 sm:left-8 sm:top-8">
        <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-black/45 p-2 shadow-xl shadow-black/30 ring-1 ring-white/15 backdrop-blur-md transition-transform duration-300 hover:scale-105 sm:size-20">
          <Image
            src="/logos/logo.svg"
            alt="Logo"
            width={72}
            height={78}
            priority
            className="size-full object-contain drop-shadow-md"
          />
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-1 flex-col items-center px-4 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-20 sm:px-6 sm:pb-8 sm:pt-28">
        <div className="my-auto w-full max-w-md rounded-3xl border border-white/15 bg-black/45 p-4 shadow-2xl shadow-black/40 ring-1 ring-white/5 backdrop-blur-xl sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};
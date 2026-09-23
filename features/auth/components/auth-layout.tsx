import Image from "next/image";

export const AuthLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="relative flex h-svh max-h-svh w-full flex-col overflow-hidden bg-black">
      {/* Background image */}
      <Image
        src="/assets/login_1.jpeg"
        alt=""
        fill
        priority
        className="object-cover"
      />
      {/* Dark gradient overlay so text stays readable */}
      <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/45 to-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0%,rgba(0,0,0,0.28)_70%)]" />

      {/* Brand lockup */}
      <div className="absolute top-6 left-6 z-20 sm:top-8 sm:left-8">
        <div className="flex size-18 items-center justify-center overflow-hidden rounded-2xl bg-black/45 p-2 backdrop-blur-md ring-1 ring-white/15 shadow-xl shadow-black/30 transition-transform duration-300 hover:scale-105 sm:size-20">
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

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center px-4 py-4 sm:px-6">
        <div className="max-h-full w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-black/35 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};
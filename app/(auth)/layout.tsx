import { AuthLayout } from "@/features/auth/components/auth-layout";

const Layout = ({ children }: { children: React.ReactNode; }) => {
  return (
    <AuthLayout>
      {children} {/* 👉 This will render the login or register page inside the AuthLayout */}
    </AuthLayout>
  );
};

export default Layout;
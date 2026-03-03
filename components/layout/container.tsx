import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100 dark:bg-gray-900">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

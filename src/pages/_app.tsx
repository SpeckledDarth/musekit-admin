import type { AppProps } from "next/app";
import { AdminLayout } from "@/layout/AdminLayout";
import { Toaster } from "sonner";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AdminLayout>
      <Component {...pageProps} />
      <Toaster position="bottom-right" richColors closeButton />
    </AdminLayout>
  );
}

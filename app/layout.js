import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "SecureVault — Encrypted Password Manager",
  description:
    "Store and manage your passwords securely with AES-256 client-side encryption powered by SecureVault.",
  keywords: ["password manager", "encrypted vault", "secure", "privacy"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.875rem",
              boxShadow: "var(--shadow-card)",
            },
            success: {
              iconTheme: { primary: "var(--success)", secondary: "var(--bg-card)" },
            },
            error: {
              iconTheme: { primary: "var(--danger)", secondary: "var(--bg-card)" },
            },
          }}
        />
      </body>
    </html>
  );
}

"use client";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import useLoginStore from "@/State";
import { Login } from "@/components/login";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { username, isLoggedIn, login, logout } = useLoginStore();

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
      </head>

      <body className="min-h-screen flex flex-row-reverse bg-white bg-cover bg-no-repeat">
        {isLoggedIn ? (
          <>
            <Sidebar /> {/* Render the Sidebar component */}
            <main className="w-full max-w-screen-2xl ">
              {" "}
              {/* Flex-1 to take remaining space */}
              {children} {/* Render the children content */}
            </main>
          </>
        ) : (
          <Login />
        )}
      </body>
    </html>
  );
}

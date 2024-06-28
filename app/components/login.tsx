"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useLoginStore from "@/State";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { username, isLoggedIn, login, logout } = useLoginStore();

  return (
    <div className="flex h-screen w-full bg-url('hero.jpg') bg-cover bg-center">
      <div className="m-auto w-96 p-6 bg-white bg-opacity-25 rounded-lg shadow-lg border border-radius-8xl backdrop-filter backdrop-blur-lg">
        <div className="flex items-center justify-between mb-6 ">
          <h1 className="text-xl font-bold text-gray-100">Login</h1>
        </div>
        <form className="bg-opacity-25 flex-1 space-y-2 ">
          <Label className="text-sm text-gray-100">Username</Label>

          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Label className="text-sm text-gray-100">Password</Label>

          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            className="text-white w-full "
            type="submit"
            onClick={() => {
              document.cookie = `email=${email}; password=${password}`;
              login(email, password);

              router.push("/");
            }}
          >
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}

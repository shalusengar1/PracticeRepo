import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/hooks/reduxHooks/useAuth";
import { useLocation } from "react-router-dom"

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname || "/dashboard";

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // if (!email || !password) {
    //   setError("Email and password are required.");
    //   setIsSubmitting(false);
    //   return;
    // }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/login`,
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      // console.log("response is", response.data);
      signIn({...response.data.user, token:response.data.token}, from);
      // localStorage.setItem("token", response.data.token);
      // navigate("/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat().join("\n");
          setError(`Validation Errors:\n${errorMessages}`);
        } else if (errorData.message) {
          setError(`Server Error:\n${errorData.message}`);
        } else {
          setError("Server Error:\nAn unexpected server error occurred.");
        }
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-brand-purple via-admin-lightblue to-white p-4 sm:p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-10 flex flex-col gap-6 animate-fade-in">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <LogIn size={32} className="text-brand-purple" />
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-purple tracking-tight">
              Sign In
            </h2>
          </div>
          <p className="text-muted-foreground text-base text-center">
            Sign in to your admin dashboard
          </p>
        </div>
        <form
          className="flex flex-col gap-5 w-full"
          onSubmit={handleSignIn}
          autoComplete="off"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="text-base"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className="text-base"
              required
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm text-center" role="alert">
              {error}
            </div>
          )}
          <Button
            type="submit"
            className="w-full mt-2 bg-brand-purple hover:bg-brand-purple/90 text-white text-base font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;

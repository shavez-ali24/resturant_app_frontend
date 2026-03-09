import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLoginMutation } from "@/redux/adminRedux/adminAPI";
import gif from "@/assets/loginImg.png";
import { Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  // RTK Query Mutation
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await login({ email, password }).unwrap();
      const resolvedRole = String(res?.user?.role || res?.role || "")
        .trim()
        .toLowerCase();
      const userRole = resolvedRole === "staff" ? "staff" : "admin";

      // Store in localStorage
      localStorage.setItem("token", res.token);
      localStorage.setItem("userName", res.user?.name || res.name || "Admin");
      localStorage.setItem("userEmail", res.user?.email || res.email || email);
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("restaurantName", res.user?.restaurantName || res.restaurantName || "");
      localStorage.setItem("qrCode", res.user?.qrCode || res.qrCode || "");
      localStorage.setItem("userPassword", password);

      // Redirect based on role - staff goes to orders, admin goes to dashboard
      if (userRole === "staff") {
        navigate("/admin/orders", { replace: true });
      } else {
        navigate("/admin", { replace: true });
      }
    } catch (err) {
      setError(err?.data?.message || "Login failed, please try again.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-50/40 via-orange-50/10 to-amber-50/30">
      
      {/* LEFT SIDE IMAGE (DESKTOP ONLY) */}
      <div className="relative hidden md:block md:w-1/2">
        <img
          src={gif}
          alt="Login Background"
          className="h-screen w-full object-cover"
        />
      </div>

      {/* RIGHT SIDE LOGIN FORM */}
      <div className="relative flex w-full items-center justify-center p-4 sm:p-6 md:w-1/2">
        <div className="absolute inset-0 md:hidden">
          <img
            src={gif}
            alt="Login Background"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-950/45 via-orange-800/32 to-orange-600/24 backdrop-blur-sm" />
        </div>

        <Card className="relative z-10 w-full max-w-md rounded-2xl border border-orange-100 bg-white/95 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.55)] backdrop-blur">
          <CardHeader className="space-y-2 pb-3">
            <CardTitle className="text-center text-3xl font-bold text-gray-800">
              Welcome Back
            </CardTitle>
            <p className="text-center text-sm text-gray-500">
              Please login to continue
            </p>
          </CardHeader>

          <CardContent className="pt-2">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl border-orange-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-xl border-orange-200 bg-white pr-10 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-orange-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                  {error}
                </p>
              )}

              <div className="mt-2 flex justify-center">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 w-40 rounded-xl border border-orange-600 bg-gradient-to-r from-orange-500 to-orange-600 text-sm font-semibold text-white shadow-sm transition-colors hover:from-orange-600 hover:to-orange-700"
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      
      </div>
    </div>
  );
};

export default LoginPage;

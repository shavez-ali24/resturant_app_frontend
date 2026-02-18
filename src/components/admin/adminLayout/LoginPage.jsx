import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLoginMutation } from "@/redux/adminRedux/adminAPI";
import gif from "@/assets/loginImg.png"
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

      // Store in localStorage
      localStorage.setItem("token", res.token);
      localStorage.setItem("userName", res.user?.name || res.name || "Admin");
      localStorage.setItem("userEmail", res.user?.email || res.email || email);
      localStorage.setItem("userRole", res.user?.role || "admin");
      localStorage.setItem("restaurantName", res.user?.restaurantName || res.restaurantName || "");
      localStorage.setItem("qrCode", res.user?.qrCode || res.qrCode || "");
      localStorage.setItem("userPassword", password);

      // Redirect based on role - staff goes to orders, admin goes to dashboard
      const userRole = res.user?.role || "admin";
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
    <div className="flex min-h-screen">
      
      {/* LEFT SIDE IMAGE (DESKTOP ONLY) */}
      <div className="hidden md:block md:w-1/2 relative">
        <img
          src={gif}
          alt="Login Background"
          className="h-screen w-full object-cover"
        />
      </div>

      {/* RIGHT SIDE LOGIN FORM */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6 bg-white relative">
        <div className="absolute inset-0 md:hidden">
          <img
            src={gif}
            alt="Login Background"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <Card className="relative z-10 w-full max-w-md shadow-2xl bg-white/90 backdrop-blur ">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-bold text-gray-800">
              Welcome Back
            </CardTitle>
            <p className="text-center text-gray-500 text-sm">
              Please login to continue
            </p>
          </CardHeader>

          <CardContent >
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="focus:ring-2 focus:ring-orange-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-[#ab292b] to-[#ef8e23] hover:bg-orange-700 text-white rounded-lg shadow-md"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

            </form>
          </CardContent>
        </Card>
      
      </div>
    </div>
  );
};

export default LoginPage;

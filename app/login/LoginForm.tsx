// "use client";

// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { passwordSchema } from "@/validation/passwordSchema";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useRouter } from "next/navigation";
// import React, { useState } from "react";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { loginUser } from "./action";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Loader2 } from "lucide-react";
// import Link from "next/link";

// const formSchema = z.object({
//   email: z.string().email(),
//   password: passwordSchema,
// });

// export default function LoginForm() {
//   const [serverError, setServerError] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false); // Add loading state
//   const router = useRouter();

//   const form = useForm<z.infer<typeof formSchema>>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       email: "",
//       password: "",
//     },
//   });

//   const handleSubmit = async (data: z.infer<typeof formSchema>) => {
//     setServerError(null);
//     setIsLoading(true); // Set loading to true when submission starts

//     try {
//       const response = await loginUser({
//         email: data.email,
//         password: data.password,
//       });

//       if (response.error) {
//         setServerError(response.message);
//       } else {
//         // Redirect to the dashboard page
//         router.push("/dashboard");
//       }
//     } catch {
//       setServerError("An unexpected error occurred. Please try again.");
//     } finally {
//       setIsLoading(false); // Set loading to false when submission ends
//     }
//   };

//   // pass the email value to forget password page
//   const email = form.getValues("email");

//   return (
//     <main className="flex justify-center items-center min-h-screen">
//       <Card className="w-[380px]">
//         <CardHeader>
//           <CardTitle>Login</CardTitle>
//           <CardDescription>Login to your account</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Form {...form}>
//             <form
//               onSubmit={form.handleSubmit(handleSubmit)}
//               className="flex flex-col gap-2"
//             >
//               <FormField
//                 control={form.control}
//                 name="email"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Email</FormLabel>
//                     <FormControl>
//                       <Input {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="password"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Password</FormLabel>
//                     <FormControl>
//                       <Input {...field} type="password" />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {serverError && (
//                 <p className="text-red-500 text-sm mt-2">{serverError}</p>
//               )}
//               {/* <Button type="submit">Register</Button> */}
//               <Button type="submit" disabled={isLoading}>
//                 {isLoading ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Please wait
//                   </>
//                 ) : (
//                   "Login"
//                 )}
//               </Button>
//             </form>
//           </Form>
//         </CardContent>
//         <CardFooter className="flex-col gap-2">
//           <div className="text-muted-foreground text-sm">
//             Don't have an account?{" "}
//             <Link href="/register" className="underline">
//               Register
//             </Link>
//           </div>
//           <div className="text-muted-foreground text-sm">
//             Forgot password?{" "}
//             <Link
//               href={`/forgot-password${
//                 email ? `?email=${encodeURIComponent(email)}` : ""
//               }`}
//               className="underline"
//             >
//               Reset my password
//             </Link>
//           </div>
//         </CardFooter>
//       </Card>
//     </main>
//   );
// }

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { passwordSchema } from "@/validation/passwordSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginUser } from "./action";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import GoogleSignin from "./GoogleSignin";
import { PasswordInput } from "@/components/ui/password-input";

const formSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});

import { SystemSettings } from "@/types/internship";
import Image from "next/image";

interface LoginFormProps {
  systemSettings?: SystemSettings | null;
}

export default function LoginForm({ systemSettings }: LoginFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for success messages in URL
  useEffect(() => {
    const reset = searchParams.get('reset');
    if (reset === 'success') {
      setSuccessMessage('Password reset successful! You can now log in with your new password.');
      // Clear the URL parameter
      router.replace('/login');
    }
  }, [searchParams, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setServerError(null);
    setIsLoading(true); // Set loading to true when submission starts

    try {
      const response = await loginUser({
        email: data.email,
        password: data.password,
      });

      if (response.error) {
        setServerError(response.message);
      } else {
        // Debug: Check what user data we received
        console.log("Login response:", response);
        console.log("User type:", response.user?.user_type);
        
        // Redirect based on user type
        const userType = response.user?.user_type;
        switch (userType) {
          case 1: // Admin
            console.log("Redirecting to admin dashboard");
            router.push("/admin/dashboard");
            break;
          case 2: // Student
            console.log("Redirecting to student dashboard");
            router.push("/student/dashboard");
            break;
          case 3: // Coordinator
            console.log("Redirecting to coordinator dashboard");
            router.push("/coordinator/dashboard");
            break;
          default:
            console.log("Redirecting to student dashboard as default");
            router.push("/student/dashboard");
        }
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false); // Set loading to false when submission ends
    }
  };

  // pass the email value to forget password page
  const email = form.getValues("email");

  return (
    <main className="flex justify-center items-center min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-4 text-center">
          {systemSettings?.logo_url ? (
            <div className="flex justify-center mb-4">
              <Image
                src={systemSettings.logo_url}
                alt="System Logo"
                width={80}
                height={80}
                priority
              />
            </div>
          ) : null}
          <div>
            <CardTitle className="text-2xl sm:text-3xl font-bold">
              {systemSettings?.name || 'Login'}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2">
              Login to your account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex flex-col gap-4 sm:gap-6"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm sm:text-base">Email</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 text-base" placeholder="Enter your email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm sm:text-base">Password</FormLabel>
                    <FormControl>
                      <PasswordInput {...field} className="h-11 text-base" placeholder="Enter your password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-green-800 text-sm font-medium">{successMessage}</p>
                </div>
              )}
              {serverError && (
                <p className="text-red-500 text-sm mt-2 text-center">{serverError}</p>
              )}
              <Button type="submit" disabled={isLoading} className="h-11 text-base font-medium">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  "Login"
                )}
              </Button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <GoogleSignin />
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col gap-3 sm:gap-4">
          <div className="text-muted-foreground text-sm text-center">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline font-medium">
              Register
            </Link>
          </div>
          <div className="text-muted-foreground text-sm text-center">
            Forgot password?{" "}
            <Link
              href={`/forgot-password${
                email ? `?email=${encodeURIComponent(email)}` : ""
              }`}
              className="underline font-medium"
            >
              Reset my password
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}

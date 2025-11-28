"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends Omit<InputProps, "type"> {
  showPassword?: boolean;
  onShowPasswordChange?: (show: boolean) => void;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showPassword: controlledShowPassword, onShowPasswordChange, ...props }, ref) => {
    const [internalShowPassword, setInternalShowPassword] = React.useState(false);
    
    const showPassword = controlledShowPassword ?? internalShowPassword;
    const setShowPassword = onShowPasswordChange ?? setInternalShowPassword;

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={togglePasswordVisibility}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-500" />
          ) : (
            <Eye className="h-4 w-4 text-gray-500" />
          )}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
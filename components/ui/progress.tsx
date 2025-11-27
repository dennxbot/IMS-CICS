import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "destructive"
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, color = "default", ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    const colorClasses = {
      default: "bg-gray-200",
      primary: "bg-blue-500",
      secondary: "bg-gray-400",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      destructive: "bg-red-500",
    }

    return (
      <div
        ref={ref}
        className={cn("w-full bg-gray-200 rounded-full h-2 overflow-hidden", className)}
        {...props}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-300", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
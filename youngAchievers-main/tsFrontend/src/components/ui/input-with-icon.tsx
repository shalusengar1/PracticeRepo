
import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ className, icon: Icon, ...props }, ref) => {
    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          className={cn("pl-10", className)}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

InputWithIcon.displayName = "InputWithIcon";

export { InputWithIcon };

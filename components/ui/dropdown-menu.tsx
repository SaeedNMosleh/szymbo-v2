"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Simple dropdown menu implementation without Radix UI
interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

interface DropdownMenuComponentProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child,
            Object.assign({}, child.props, {
              isOpen,
              setIsOpen,
            }) as DropdownMenuComponentProps
          );
        }
        return child;
      })}
    </div>
  );
};

const DropdownMenuTrigger = ({
  children,
  asChild,
  ...props
}: DropdownMenuTriggerProps & {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (props.setIsOpen) {
      props.setIsOpen(!props.isOpen);
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children,
      Object.assign({}, children.props, {
        onClick: handleClick,
      }) as React.HTMLAttributes<HTMLElement>
    );
  }

  return <div onClick={handleClick}>{children}</div>;
};

const DropdownMenuContent = ({
  children,
  align = "end",
  className,
  isOpen,
  setIsOpen,
}: DropdownMenuContentProps & DropdownMenuComponentProps) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        if (setIsOpen) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const alignClass =
    align === "end"
      ? "right-0"
      : align === "start"
        ? "left-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute top-full mt-1 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white shadow-md",
        alignClass,
        className
      )}
    >
      <div className="p-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(
              child,
              Object.assign({}, child.props, {
                setIsOpen,
              }) as DropdownMenuComponentProps
            );
          }
          return child;
        })}
      </div>
    </div>
  );
};

const DropdownMenuItem = ({
  children,
  onClick,
  className,
  ...props
}: DropdownMenuItemProps & { setIsOpen?: (open: boolean) => void }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (props.setIsOpen) {
      props.setIsOpen(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
};

const DropdownMenuSeparator = ({ className }: DropdownMenuSeparatorProps) => {
  return <div className={cn("-mx-1 my-1 h-px bg-gray-200", className)} />;
};

interface DropdownMenuCheckboxItemProps extends DropdownMenuItemProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const DropdownMenuCheckboxItem = ({
  children,
  checked,
  onCheckedChange,
  className,
  onClick,
  ...props
}: DropdownMenuCheckboxItemProps & { setIsOpen?: (open: boolean) => void }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onCheckedChange) {
      onCheckedChange(!checked);
    }
    if (onClick) {
      onClick();
    }
    // Do not close the dropdown when checkbox is clicked
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      {children}
    </div>
  );
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
};

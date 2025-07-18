"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Simple dropdown menu implementation without Radix UI
interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: "start" | "center" | "end"
  className?: string
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

interface DropdownMenuSeparatorProps {
  className?: string
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, Object.assign({}, child.props, {
            isOpen, 
            setIsOpen 
          }) as any)
        }
        return child
      })}
    </div>
  )
}

const DropdownMenuTrigger = ({ children, asChild, ...props }: DropdownMenuTriggerProps & { isOpen?: boolean, setIsOpen?: (open: boolean) => void }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (props.setIsOpen) {
      props.setIsOpen(!props.isOpen)
    }
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, Object.assign({}, children.props, {
      onClick: handleClick
    }) as any)
  }

  return (
    <div onClick={handleClick}>
      {children}
    </div>
  )
}

const DropdownMenuContent = ({ children, align = "end", className, ...props }: DropdownMenuContentProps & { isOpen?: boolean, setIsOpen?: (open: boolean) => void }) => {
  const contentRef = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        if (props.setIsOpen) {
          props.setIsOpen(false)
        }
      }
    }

    if (props.isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [props.isOpen, props.setIsOpen])

  if (!props.isOpen) return null

  const alignClass = align === "end" ? "right-0" : align === "start" ? "left-0" : "left-1/2 -translate-x-1/2"

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
            return React.cloneElement(child, Object.assign({}, child.props, {
              setIsOpen: props.setIsOpen 
            }) as any)
          }
          return child
        })}
      </div>
    </div>
  )
}

const DropdownMenuItem = ({ children, onClick, className, ...props }: DropdownMenuItemProps & { setIsOpen?: (open: boolean) => void }) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
    }
    if (props.setIsOpen) {
      props.setIsOpen(false)
    }
  }

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
  )
}

const DropdownMenuSeparator = ({ className }: DropdownMenuSeparatorProps) => {
  return (
    <div className={cn("-mx-1 my-1 h-px bg-gray-200", className)} />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}
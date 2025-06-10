import React from "react";
import { cn } from "../../../utils";
import { css } from "@linaria/core";

const baseStyles = css`
  padding: 4px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .animate-spin {
    margin-right: 8px;
    @media (prefers-reduced-motion: no-preference) {
      animation: logo-spin infinite 20s linear;
    }
  }
`;

const variants = {
  primary: css`
    background-color: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    border: none;

    &:hover {
      background-color: hsl(var(--primary) / 0.9);
    }
  `,
  secondary: css`
    background-color: hsl(var(--secondary));
    color: hsl(var(--secondary-foreground));
    border: none;

    &:hover {
      background-color: hsl(var(--accent));
    }
  `,
  outline: css`
    background-color: hsl(var(--background));
    color: hsl(var(--primary));
    border: 1px solid hsl(var(--input));

    &:hover {
      /* background-color: hsl(var(--accent));
      border-color: hsl(var(--accent)); */
    }
  `,
  ghost: css`
    background-color: hsl(var(--background));
    color: hsl(var(--primary));
    border: none;

    &:hover {
      background-color: hsl(var(--accent));
    }
  `,
  danger: css`
    background-color: hsl(var(--destructive));
    color: hsl(var(--destructive-foreground));
    border: none;

    &:hover {
      background-color: hsl(var(--destructive) / 0.9);
    }
  `,
};

const sizes = {
  sm: css`
    padding: 2px 12px;
    font-size: 0.875rem;
  `,
  md: css`
    padding: 4px 16px;
    font-size: 1rem;
  `,
  lg: css`
    padding: 6px 20px;
    font-size: 1.125rem;
  `,
};

const loadingStyles = css`
  opacity: 0.7;
  cursor: not-allowed;
`;

const disabledStyles = css`
  opacity: 0.5;
  cursor: not-allowed;
`;

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        isLoading && loadingStyles,
        disabled && disabledStyles,
        className
      )}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && <span className="animate-spin">⌛</span>}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}

export default Button;

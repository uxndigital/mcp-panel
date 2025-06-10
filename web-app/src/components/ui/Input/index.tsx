import React from "react";
import { cn } from "../../../utils";
import { css } from "@linaria/core";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const container = css`
  flex: 1;
  width: 100%;
  height: 36px;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid hsl(var(--input));
  font-size: 14px;
  background-color: transparent;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  box-shadow: 0 0 #000, 0 0 #000, 0 1px 2px 0 rgb(0 0 0 / 0.05),
    0 1px 2px 0 rgb(0 0 0 / 0.05);

  &::-webkit-file-upload-button {
    border: 0;
    background: transparent;
    font-size: 14px;
    font-weight: 500;
    color: inherit;
  }

  &:focus {
    outline: 2px solid transparent;
    /* outline-offset: 2px; */
    /* border-color: var(--ring-color); */
    box-shadow: 0 0 0 0 #fff, 0 0 0 1px hsl(var(--ring)),
      0 1px 2px 0 rgb(0 0 0 / 0.05);
  }

  &::placeholder {
    color: hsl(var(--muted-foreground));
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

function Input(props: Props) {
  const { className, ...rest } = props;

  return <input className={cn(container, className)} {...rest} />;
}

export default Input;

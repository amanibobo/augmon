'use client';

import * as React from 'react';
import { twMerge } from 'tailwind-merge';

type PromptInputRootProps = {
  value: string;
  onValueChange: (v: string) => void;
  isLoading?: boolean;
  onSubmit?: () => void;
  className?: string;
  children: React.ReactNode;
};

const PromptInputContext = React.createContext<{
  value: string;
  onValueChange: (v: string) => void;
  isLoading?: boolean;
  onSubmit?: () => void;
} | null>(null);

export function PromptInput({ value, onValueChange, isLoading, onSubmit, className, children }: PromptInputRootProps) {
  return (
    <PromptInputContext.Provider value={{ value, onValueChange, isLoading, onSubmit }}>
      <div className={twMerge('rounded-card border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm', className)}>
        {children}
      </div>
    </PromptInputContext.Provider>
  );
}

export function PromptInputTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ctx = React.useContext(PromptInputContext)!;
  return (
    <textarea
      {...props}
      value={ctx.value}
      onChange={(e) => ctx.onValueChange(e.target.value)}
      className={twMerge('w-full resize-none bg-[var(--background)] border border-[var(--border)] rounded-input px-3 py-2 text-sm min-h-12', props.className)}
      rows={1}
    />
  );
}

export function PromptInputActions({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={twMerge('flex items-center gap-2', className)}>{children}</div>;
}

export function PromptInputAction({ tooltip, children }: { tooltip?: string; children: React.ReactNode }) {
  return (
    <div title={tooltip} className="inline-flex items-center">
      {children}
    </div>
  );
}



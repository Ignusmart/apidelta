'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from './use-focus-trap';

// ─── Confirm Dialog ─────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div ref={trapRef} className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <button type="button" aria-label="Close" onClick={onCancel} className="animate-modal-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="animate-modal-content relative w-full max-w-sm rounded-xl border border-gray-800 bg-gray-950 p-6 shadow-2xl">
        <h3 id="confirm-title" className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-gray-400">{description}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-800 px-4 py-2 text-sm text-gray-400 transition hover:border-gray-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${
              confirmVariant === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500'
                : 'bg-violet-600 text-white hover:bg-violet-500 focus-visible:ring-violet-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Prompt Dialog ─────────────────────

interface PromptDialogProps {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog({
  open,
  title,
  description,
  placeholder,
  submitLabel = 'Save',
  onSubmit,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (open) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div ref={trapRef} className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="prompt-title">
      <button type="button" aria-label="Close" onClick={onCancel} className="animate-modal-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="animate-modal-content relative w-full max-w-sm rounded-xl border border-gray-800 bg-gray-950 p-6 shadow-2xl">
        <h3 id="prompt-title" className="text-base font-semibold text-white">{title}</h3>
        {description && <p className="mt-2 text-sm text-gray-400">{description}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) onSubmit(value.trim());
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="mt-4 w-full rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
          />
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-800 px-4 py-2 text-sm text-gray-400 transition hover:border-gray-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Hook helpers ─────────────────────

export function useConfirm() {
  const [state, setState] = useState<{
    title: string;
    description: string;
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'default';
    resolve: (confirmed: boolean) => void;
  } | null>(null);

  const confirm = useCallback((opts: { title: string; description: string; confirmLabel?: string; confirmVariant?: 'danger' | 'default' }) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const dialog = state ? (
    <ConfirmDialog
      open
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      confirmVariant={state.confirmVariant}
      onConfirm={() => { state.resolve(true); setState(null); }}
      onCancel={() => { state.resolve(false); setState(null); }}
    />
  ) : null;

  return { confirm, dialog };
}

export function usePrompt() {
  const [state, setState] = useState<{
    title: string;
    description?: string;
    placeholder?: string;
    submitLabel?: string;
    resolve: (value: string | null) => void;
  } | null>(null);

  const prompt = useCallback((opts: { title: string; description?: string; placeholder?: string; submitLabel?: string }) => {
    return new Promise<string | null>((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const dialog = state ? (
    <PromptDialog
      open
      title={state.title}
      description={state.description}
      placeholder={state.placeholder}
      submitLabel={state.submitLabel}
      onSubmit={(v) => { state.resolve(v); setState(null); }}
      onCancel={() => { state.resolve(null); setState(null); }}
    />
  ) : null;

  return { prompt, dialog };
}

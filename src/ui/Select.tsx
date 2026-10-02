"use client";

import {
  FC,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { motionTokens, springs } from "@/src/lib/motion-tokens";
import scss from "./Select.module.scss";

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SelectProps {
  options: SelectOption[];
  // Controlled when `value` is passed; otherwise starts at `defaultValue`.
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  // Form use: `name` renders a hidden input so Server Actions receive the
  // value like from a native <select>; `id` pairs with <label htmlFor>.
  name?: string;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
  submitOnChange?: boolean;
  block?: boolean;
  placeholder?: string;
}

// Space left below the trigger before the panel flips upward.
const PANEL_SPACE = 340;

const ChevronIcon: FC<{ open: boolean }> = ({ open }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={scss.chevron}
    style={open ? { transform: "rotate(180deg)" } : undefined}
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const CheckIcon: FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={scss.option__check}
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// Generic custom select — a native <select> can't be styled to match a
// dark custom UI (especially the dropdown popup itself). Used by the
// /team filters and by every admin form.
const Select: FC<SelectProps> = ({
  options,
  value,
  defaultValue,
  onChange,
  ariaLabel,
  name,
  id,
  invalid,
  describedBy,
  disabled,
  submitOnChange,
  block,
  placeholder = "Выберите…",
}) => {
  const [open, setOpen] = useState(false);
  const [upward, setUpward] = useState(false);
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = value ?? inner;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listId = useId();
  const selected = options.find((option) => option.value === current);

  // A new defaultValue (e.g. values echoed back after a failed action)
  // resets the uncontrolled choice — adjusted during render, not in an
  // effect, as React recommends for derived state.
  const [seenDefault, setSeenDefault] = useState(defaultValue);
  if (defaultValue !== seenDefault) {
    setSeenDefault(defaultValue);
    setInner(defaultValue ?? "");
  }

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  // Focus the selected option when the panel opens.
  useEffect(() => {
    if (!open) return;
    const index = Math.max(
      0,
      options.findIndex((option) => option.value === current),
    );
    optionRefs.current[index]?.focus();
  }, [open, options, current]);

  const openPanel = () => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    setUpward(
      rect !== undefined &&
        window.innerHeight - rect.bottom < PANEL_SPACE &&
        rect.top > window.innerHeight - rect.bottom,
    );
    setOpen(true);
  };

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const choose = (next: string) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
    close();
    if (submitOnChange && inputRef.current) {
      inputRef.current.value = next;
      inputRef.current.form?.requestSubmit();
    }
  };

  const handleTriggerKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openPanel();
    }
  };

  const handleOptionKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = options.length - 1;
    const target =
      event.key === "ArrowDown"
        ? Math.min(index + 1, last)
        : event.key === "ArrowUp"
          ? Math.max(index - 1, 0)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (target !== null) {
      event.preventDefault();
      optionRefs.current[target]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      close(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`${scss.select} ${block ? scss["select--block"] : ""}`}
    >
      {name && <input ref={inputRef} type="hidden" name={name} value={current} />}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`${scss.trigger} ${invalid ? scss["trigger--invalid"] : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={id ? undefined : ariaLabel}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => (open ? close(false) : openPanel())}
        onKeyDown={handleTriggerKey}
      >
        {selected?.icon && <span className={scss.trigger__icon}>{selected.icon}</span>}
        <span className={`${scss.trigger__label} ${selected ? "" : scss["trigger__label--placeholder"]}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronIcon open={open} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className={`${scss.panel} ${upward ? scss["panel--up"] : ""}`}
            initial={{ opacity: 0, scale: 0.97, y: upward ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            // Exit faster than enter so closing never lingers.
            exit={{
              opacity: 0,
              scale: 0.97,
              y: upward ? 4 : -4,
              transition: { duration: motionTokens.duration.fast },
            }}
            transition={springs.gentle}
          >
            {options.map((option, index) => {
              const isSelected = option.value === current;
              return (
                <button
                  key={option.value}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`${scss.option} ${isSelected ? scss["option--active"] : ""}`}
                  onClick={() => choose(option.value)}
                  onKeyDown={(event) => handleOptionKey(event, index)}
                >
                  {option.icon && <span className={scss.option__icon}>{option.icon}</span>}
                  <span className={scss.option__label}>{option.label}</span>
                  {isSelected && <CheckIcon />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Select;

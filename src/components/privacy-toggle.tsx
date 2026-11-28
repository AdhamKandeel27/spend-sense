"use client";

import { Eye, EyeOff } from "lucide-react";
import { useSyncExternalStore } from "react";
import { getDefaultHidden, isHidden, setDefaultHidden, setHidden, subscribePrivacy } from "@/lib/privacy";

export function useAmountsHidden() {
  return useSyncExternalStore(subscribePrivacy, isHidden, () => false);
}

/** The eye: hides or shows every money amount in the app. */
export function PrivacyToggle({ className = "", label = false }: { className?: string; label?: boolean }) {
  const hidden = useAmountsHidden();
  const Icon = hidden ? EyeOff : Eye;
  return (
    <button
      type="button"
      onClick={() => setHidden(!hidden)}
      aria-pressed={hidden}
      aria-label={hidden ? "Show amounts" : "Hide amounts"}
      title={hidden ? "Show amounts" : "Hide amounts"}
      className={`inline-flex min-h-10 min-w-10 items-center justify-center gap-2 ${className}`}
    >
      <Icon size={20} aria-hidden />
      {label && <span>{hidden ? "Show amounts" : "Hide amounts"}</span>}
    </button>
  );
}

/** Account setting: whether the app opens with amounts hidden (this device). */
export function PrivacyDefault() {
  const hideByDefault = useSyncExternalStore(subscribePrivacy, getDefaultHidden, () => false);
  const choose = (hide: boolean) => {
    setDefaultHidden(hide);
    setHidden(hide);
  };
  return (
    <fieldset>
      <legend className="sr-only">When the app opens</legend>
      <div className="grid grid-cols-2 border border-line-strong bg-card">
        {[
          { hide: false, label: "Show amounts", icon: Eye },
          { hide: true, label: "Hide amounts", icon: EyeOff },
        ].map((o) => (
          <label
            key={o.label}
            className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 px-3 text-[0.9375rem] font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-ink ${
              hideByDefault === o.hide ? "bg-ink text-ground" : "text-ink-2 hover:text-ink"
            }`}
          >
            <input type="radio" name="hide-default" className="sr-only" checked={hideByDefault === o.hide} onChange={() => choose(o.hide)} />
            <o.icon size={18} aria-hidden /> {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

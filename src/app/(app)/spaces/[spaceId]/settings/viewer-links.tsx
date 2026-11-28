"use client";

import { Check, Copy, Link2, Share2, X } from "lucide-react";
import { useActionState, useState, useSyncExternalStore, useTransition } from "react";
import { Button } from "@/components/ui";
import { initialFormState, type FormState } from "@/lib/actions/state";

type Viewer = { id: string; name: string; token: string; created: string; opened: string | null };

const noop = () => () => {};
/** Phones offer the system share sheet (WhatsApp, Messages…); desktops mostly don't. */
function useCanShare() {
  return useSyncExternalStore(
    noop,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  );
}

function linkFor(token: string) {
  return `${window.location.origin}/share/${token}`;
}

export function ViewerLinks({
  spaceName,
  viewers,
  create,
  remove,
}: {
  spaceName: string;
  viewers: Viewer[];
  create: (prev: FormState, fd: FormData) => Promise<FormState>;
  remove: (fd: FormData) => Promise<void>;
}) {
  const [state, formAction, pending] = useActionState(create, initialFormState);
  const [formKey, setFormKey] = useState(0);
  const error = state.fieldErrors?.name;
  // After creating a link, the newest one (first in the list) is highlighted.
  const newestId = state.ok ? viewers[0]?.id : undefined;

  return (
    <div className="flex flex-col gap-3">
      <form
        key={formKey}
        action={async (fd) => {
          await formAction(fd);
          setFormKey((k) => k + 1);
        }}
        className="flex gap-2"
      >
        <label className="sr-only" htmlFor="viewer-name">
          Viewer name
        </label>
        <input
          id="viewer-name"
          name="name"
          required
          maxLength={60}
          defaultValue={error ? state.values?.name : undefined}
          placeholder="Who is it for? e.g. Mom"
          className="field"
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? "viewer-name-error" : undefined}
        />
        <Button type="submit" variant="secondary" pending={pending} className="shrink-0">
          <Link2 size={16} aria-hidden /> Create link
        </Button>
      </form>
      {error && (
        <p id="viewer-name-error" className="text-[0.8125rem] font-medium text-danger">
          {error}
        </p>
      )}

      {viewers.length > 0 && (
        <ul className="border-t border-line">
          {viewers.map((v) => (
            <ViewerRow key={v.id} viewer={v} spaceName={spaceName} highlight={v.id === newestId} remove={remove} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ViewerRow({
  viewer,
  spaceName,
  highlight,
  remove,
}: {
  viewer: Viewer;
  spaceName: string;
  highlight: boolean;
  remove: (fd: FormData) => Promise<void>;
}) {
  const canShare = useCanShare();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removing, startRemove] = useTransition();

  async function copy() {
    try {
      await navigator.clipboard.writeText(linkFor(viewer.token));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard access: show the link so it can be copied by hand.
      setCopyFailed(true);
    }
  }

  async function share() {
    try {
      await navigator.share({ title: spaceName, text: `${spaceName} on Spend Sense (view only)`, url: linkFor(viewer.token) });
    } catch {
      // Closing the share sheet rejects; nothing to do.
    }
  }

  return (
    <li className={`border-b border-line py-3 ${highlight ? "bg-[#e7f0ea] -mx-3 px-3" : ""} ${removing ? "opacity-50" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{viewer.name}</p>
          <p className="text-[0.8125rem] text-ink-3">
            Created {viewer.created} · {viewer.opened ? `last opened ${viewer.opened}` : "not opened yet"}
          </p>
        </div>

        {confirming ? (
          <div className="flex items-center gap-2" role="group" aria-label={`Remove ${viewer.name}'s link`}>
            <span className="text-[0.8125rem] text-ink-2">Their link stops working.</span>
            <Button
              variant="danger"
              className="bg-danger !text-white hover:brightness-110"
              pending={removing}
              onClick={() => {
                const fd = new FormData();
                fd.set("id", viewer.id);
                startRemove(() => remove(fd));
              }}
            >
              Remove
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={removing}>
              Keep
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant={highlight ? "primary" : "secondary"} onClick={copy} className="min-w-32">
              {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
              <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
            </Button>
            {canShare && (
              <Button variant="secondary" onClick={share} aria-label={`Share ${viewer.name}'s link`} className="px-3">
                <Share2 size={16} aria-hidden />
              </Button>
            )}
            <Button variant="ghost" onClick={() => setConfirming(true)} aria-label={`Remove ${viewer.name}'s link`} className="px-2.5">
              <X size={18} aria-hidden />
            </Button>
          </div>
        )}
      </div>
      {copyFailed && (
        <input
          readOnly
          value={linkFor(viewer.token)}
          onFocus={(e) => e.target.select()}
          autoFocus
          className="field mt-2 text-[0.8125rem]"
          aria-label={`${viewer.name}'s link`}
        />
      )}
    </li>
  );
}

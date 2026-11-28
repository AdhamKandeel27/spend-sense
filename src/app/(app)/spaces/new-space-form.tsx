"use client";

import { useActionState } from "react";
import { Button, Field } from "@/components/ui";
import { createSpace } from "@/lib/actions/spaces";
import { initialFormState } from "@/lib/actions/state";

export function NewSpaceForm({ defaultName = "" }: { defaultName?: string }) {
  const [state, action, pending] = useActionState(createSpace, initialFormState);
  const v = state.values ?? {};

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Name" htmlFor="name" error={state.fieldErrors?.name}>
        <input
          id="name"
          name="name"
          required
          maxLength={80}
          defaultValue={v.name ?? defaultName}
          placeholder="New Home"
          className="field"
          aria-invalid={!!state.fieldErrors?.name}
        />
      </Field>
      <Field label="Description (optional)" htmlFor="description" error={state.fieldErrors?.description}>
        <input
          id="description"
          name="description"
          maxLength={280}
          defaultValue={v.description}
          placeholder="Finishing the apartment in New Cairo"
          className="field"
        />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[0.8125rem] font-semibold text-ink-2">Start with</legend>
        <label className="flex cursor-pointer items-start gap-3 border border-line-strong bg-card p-3 has-[:checked]:border-ink has-[:checked]:shadow-[inset_0_0_0_1px_var(--color-ink)]">
          <input type="radio" name="template" value="home" defaultChecked={(v.template ?? "home") === "home"} className="mt-1 accent-ink" />
          <span>
            <span className="block font-semibold">Home-build categories and rooms</span>
            <span className="block text-[0.875rem] text-ink-2">
              Flooring &amp; marble, Ceramics, Kitchen, Appliances… plus Kitchen, Living room, Master bath and more.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 border border-line-strong bg-card p-3 has-[:checked]:border-ink has-[:checked]:shadow-[inset_0_0_0_1px_var(--color-ink)]">
          <input type="radio" name="template" value="empty" defaultChecked={v.template === "empty"} className="mt-1 accent-ink" />
          <span>
            <span className="block font-semibold">Nothing, I&rsquo;ll add my own</span>
            <span className="block text-[0.875rem] text-ink-2">You can create categories while adding purchases.</span>
          </span>
        </label>
      </fieldset>
      {state.error && <p role="alert" className="text-danger">{state.error}</p>}
      <Button type="submit" variant="primary" pending={pending} pendingLabel="Creating…" className="self-start">
        Create space
      </Button>
    </form>
  );
}

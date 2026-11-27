export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Echo of submitted values so the form can refill after a failed submit. */
  values?: Record<string, string>;
  ok?: boolean;
};

export const initialFormState: FormState = {};

export function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  }
  return out;
}

/*
  Controlled inputs — React owns the value, the DOM just reflects it.

  PROBLEM
  -------
  You're building a message composer: an email field that validates as you type,
  a multi-field form where Submit stays disabled until required fields are filled,
  and a textarea that shows a live character count. Each of these needs to READ
  the input's value on every keystroke — to validate, gate a button, or show a
  preview. If the browser owns the input's value (the HTML default), you can only
  read it at submit time. Getting it earlier requires reaching into the DOM
  manually, which fights React's model.

  CONCEPT
  -------
  Make React the single source of truth for the input's value: bind `value={state}`
  and update state on every keystroke via `onChange`. The DOM becomes a mirror of
  the slot, not an independent store. Because you now have the value in state on
  every keystroke, validation, button gating, and previewing are just values
  derived during render — no DOM reads, no extra slots, no synchronization.

  KEY INSIGHT
  -----------
  If you need the input's value before the user submits — to validate, gate a
  button, or show a preview — React should own it. If you only need the value at
  submit time, uncontrolled (a ref) is fine and simpler.

  IN THIS FILE
  ------------
  • EmailInput     — single field with live validation (red border + message when no "@")
  • MessageComposer— multi-field form: one shared state object, one generic handler,
                     derived Submit gating
  • LivePreview    — textarea with live character count and preview

  RUNNING THEME
  -------------
  Derive, don't duplicate: anything computable from state is computed during render,
  never stored in a second slot. A second slot is a second source of truth, and two
  sources of truth drift.

  PYTHON ANALOGY
  --------------
  A property with a getter/setter enforcing an invariant — the stored value and the
  exposed value are the same by construction.
*/

import React, { useState } from "react";

// ── EmailInput — basic controlled input (DEFINITION) ──────────────────────────
// PURPOSE: shows the core pattern plus DERIVED validation — no `isValid` slot,
// just a computed value from the current email string.
//
// value={email} hands control to React; onChange fires on every keystroke
// (React supplies `e`, and e.target.value is the new text). Set value WITHOUT
// onChange and the field freezes — React keeps resetting it to the slot value.

function EmailInput() {
  const [email, setEmail] = useState("");

  // DERIVED, not stored. Recomputed every render from email — impossible to
  // drift from what's displayed.
  const isValid = email === "" || email.includes("@");

  return (
    <div>
      <input
        type="email"
        value={email}                              // React controls the value
        onChange={(e) => setEmail(e.target.value)} // e supplied by React; e.target is the <input>
        placeholder="alice@example.com"
        style={{ borderColor: isValid ? "" : "red" }}
      />
      {!isValid && <p style={{ color: "red" }}>Enter a valid email address.</p>}
    </div>
  );
}

// ── MessageComposer — multi-field form (DEFINITION) ───────────────────────────
// PURPOSE: scales controlled inputs to a form — one state object holds all fields,
// one generic handler updates whichever field fired, and Submit gating is derived.

interface MessageForm {
  displayName: string;
  message: string;
  role: "user" | "assistant";
}

function MessageComposer() {
  const [form, setForm] = useState<MessageForm>({
    displayName: "",
    message: "",
    role: "user",
  });

  // One handler for all fields. React supplies `e`; e.target.name is the input's
  // `name` attribute (which field fired); e.target.value is the new text.
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    // [name] is a computed property key: the VALUE of `name` becomes the key.
    // Python: {**prev, name: value} where name is a variable, not the literal "name".
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    // Without this the browser does its 1995 default: serialize the form and reload
    // the page. preventDefault() keeps it a SPA interaction.
    e.preventDefault();
    console.log("Submitted:", form);
  }

  // Derived — the button's enabled-ness is a function of the form, not a slot.
  const canSubmit = form.displayName.trim() && form.message.trim();

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name</label>
        {/* `name` here is what handleChange reads off e.target.name */}
        <input name="displayName" value={form.displayName} onChange={handleChange} />
      </div>
      <div>
        <label>Message</label>
        <textarea name="message" value={form.message} onChange={handleChange} rows={3} />
      </div>
      <div>
        <label>Role</label>
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="user">User</option>
          <option value="assistant">Assistant</option>
        </select>
      </div>
      <button type="submit" disabled={!canSubmit}>Submit</button>
    </form>
  );
}

// ── LivePreview — real-time preview (DEFINITION) ──────────────────────────────
// PURPOSE: the clearest demonstration of WHY controlled is worth it. The preview
// and character count are derived from state during render — no syncing, no second
// slot, no effect. This is impossible without owning the value on every keystroke.

function LivePreview() {
  const [text, setText] = useState("");

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message…"
        rows={4}
      />
      <div>
        <strong>Preview ({text.length} chars):</strong>
        {/* `&&` short-circuit: `text` is a string — "" is falsy, so this is safe.
            FOOTGUN: `text.length && <p/>` would render the NUMBER 0 on screen when
            empty, because 0 is falsy yet still a renderable value in JSX. Rule:
            coerce to bool first — `text.length > 0 && <p/>` — or use a ternary. */}
        {text && <p>{text}</p>}
        {!text && <p style={{ color: "grey" }}>Nothing typed yet.</p>}
      </div>
    </div>
  );
}

export { EmailInput, MessageComposer, LivePreview };

/*
  CONTROLLED INPUTS: the React pattern where the form element's displayed value
  is always the value stored in state — the input is "controlled" by React.

  UNCONTROLLED: the DOM owns the value; you read it via a ref.
  CONTROLLED: React owns the value; the DOM reflects state.

  React strongly recommends controlled inputs for most cases: the input's value
  and your state are always in sync, so you can validate, transform, and submit
  without any ceremony.

  Python analogy: a property with a getter and setter that enforces invariants —
  the value is never "out of sync" with the backing store.
*/

import React, { useState } from "react";

// === BASIC CONTROLLED INPUT ===================================================
// The input's `value` prop = the state value.
// The `onChange` handler updates state on every keystroke.
// If you omit onChange but set value, the input becomes read-only (React will warn).

function EmailInput() {
  const [email, setEmail] = useState("");

  // Derive validation state from the current value — don't store a separate `isValid` boolean.
  // Derived state keeps things consistent: there's only one source of truth.
  const isValid = email === "" || email.includes("@");

  return (
    <div>
      <input
        type="email"
        value={email}                                   // React controls the displayed value
        onChange={e => setEmail(e.target.value)}       // update state on every keystroke
        placeholder="alice@example.com"
        style={{ borderColor: isValid ? "" : "red" }}
      />
      {/* Only show error text when there's a value AND it's invalid — && pattern */}
      {!isValid && <p style={{ color: "red" }}>Enter a valid email address.</p>}
    </div>
  );
}

// === MULTI-FIELD FORM =========================================================
// For forms with multiple fields, store all values in one state object.
// The generic handleChange function updates the field that triggered the event.

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

  // Generic field updater — `name` is the input's name attribute, `value` is the new value.
  // Python analogy: setattr(self.form, name, value)
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Computed property name: [name] evaluates `name` as the key.
    // Python: {**prev, name: value}  where name is a variable
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();  // prevent the browser from reloading the page (default form behaviour)
    console.log("Submitted:", form);
  }

  const canSubmit = form.displayName.trim() && form.message.trim();

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name</label>
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

// === REAL-TIME PREVIEW ========================================================
// The power of controlled inputs: because state is the source of truth,
// you can derive a live preview from it in the same render — no extra wiring.

function LivePreview() {
  const [text, setText] = useState("");

  return (
    <div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type your message…"
        rows={4}
      />
      <div>
        <strong>Preview ({text.length} chars):</strong>
        {/* Only show the preview when there's something to show — && pattern */}
        {text && <p>{text}</p>}
        {!text && <p style={{ color: "grey" }}>Nothing typed yet.</p>}
      </div>
    </div>
  );
}

export { EmailInput, MessageComposer, LivePreview };

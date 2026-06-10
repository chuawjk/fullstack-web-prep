/*
  JavaScript is the programming language that runs in the browser and makes a
  page interactive. HTML = structure, CSS = appearance, JS = behaviour.

  When the browser loads the HTML, it parses it into a live tree of objects
  called the DOM (Document Object Model). Every HTML element becomes an object
  you can read and change from JavaScript. Change the DOM → the page updates.

  Python mental model: imagine the page parsed into a tree of live objects where
  mutating an object's attributes immediately repaints the screen.
*/

// --- 1. SELECT elements we need -----------------------------------------------
// document.getElementById finds ONE element by its id="..." attribute.
// Python equivalent: looking up a known key in a dict.
const input = document.getElementById("input");
const sendButton = document.getElementById("send");
const messages = document.getElementById("messages");

// --- 2. A function that CREATES a message and adds it to the page -------------
function addMessage(text) {
  // Make a brand-new <div>. It exists in memory but isn't on the page yet.
  const div = document.createElement("div");

  // Give it classes so our existing CSS styles it as a user bubble.
  // .className reads/writes the element's HTML class attribute.
  div.className = "message message--user";

  // .textContent sets the TEXT inside the element. We use textContent (not
  // innerHTML) so typed text is treated as plain text, never as markup — a
  // basic safety habit you'll see enforced everywhere.
  div.textContent = text;

  // Attach the new div as a child of the messages container.
  // THIS line is the moment the page visibly changes.
  messages.appendChild(div);
}

// --- 3. EVENTS: run code in response to user actions --------------------------
// The browser fires "events" (click, keydown, ...). addEventListener registers
// a function to run when one happens. Python equivalent: a callback for a signal.
sendButton.addEventListener("click", () => {
  const text = input.value.trim();  // .value is the current text in the input box
  if (text === "") return;          // ignore empty sends
  addMessage(text);
  input.value = "";                 // clear the box after sending
});

// Bonus: let the Enter key send too. The handler receives an "event" object
// describing what happened — here we check which key was pressed.
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendButton.click();             // reuse the exact same logic as clicking Send
  }
});

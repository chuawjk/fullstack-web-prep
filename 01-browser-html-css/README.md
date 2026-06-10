# 01 — The Browser, HTML & CSS

Your goal here is to _read and modify_, not to master CSS layout. We do just enough that you can open any web page, understand its structure, and reason about how it's styled. The deep time goes to TypeScript and React later.

## What you'll be able to do after this

- Explain what HTML, CSS, and JavaScript each do, and how they divide responsibility
- Read semantic HTML and describe the structure of a page from its tags
- Read CSS and explain the **box model**, what a **selector** targets, and how a **flexbox** layout stacks things
- Open the browser's DevTools, inspect an element, and change its style live
- Read DOM-and-event JavaScript and explain _what triggers a visual update on the page_

## The one idea that frames everything

A web page is built from three languages, each with one job:

- **HTML** (HyperText Markup Language) — the **structure**. What elements exist and how they nest. Not a programming language: no variables, no loops. It's the skeleton.
- **CSS** (Cascading Style Sheets) — the **appearance**. How the structure looks: colour, spacing, layout.
- **JavaScript** — the **behaviour**. The actual programming language that makes the page respond to the user.

The thing that runs all three is the **browser** — it is the runtime here, the way the Python interpreter is the runtime for your scripts. When the browser loads HTML, it parses it into a live tree of objects called the **DOM** (Document Object Model). Each HTML element becomes an object. JavaScript changes those objects, and the screen updates instantly. That loop — _change the DOM, the page re-renders_ — is the heart of all frontend work, including React later.

> There is no clean Python equivalent for HTML/CSS. The closest mental model: HTML is a nested data structure describing a document tree; the DOM is that tree parsed into live objects whose mutations immediately repaint the screen.

## Files, in reading order

| Order | File                | What it teaches                                                      |
| ----- | ------------------- | -------------------------------------------------------------------- |
| 1     | `index.html`        | Semantic HTML structure — a tiny chat UI (foreshadowing the project) |
| 2     | `styles.css`        | The box model, selectors, and a flexbox layout                       |
| 3     | `dom-and-events.js` | Selecting elements, handling events, updating the DOM                |

Every file is heavily commented. Read the comments — they _are_ the lesson.

## How to run it

No build step needed. Either:

- **Simplest:** double-click `index.html` to open it in your browser, **or**
- From this folder, run a quick local server and visit the URL it prints:
  ```bash
  python3 -m http.server 8000
  # then open http://localhost:8000 in your browser
  ```

You should see a small chat page. Type a message and hit **Send** (or press Enter) — a new bubble appears. That bubble is JavaScript mutating the DOM.

## Try these

Make small changes and reload to see what happens. This is how the box model and selectors become intuition:

1. In `styles.css`, change `.message--user`'s `background` to a different colour. Reload.
2. In `index.html`, add a third starting message. Reload.
3. In `styles.css`, change `main`'s `flex-direction` from `column` to `row` and observe how the whole layout flips. Change it back.
4. Open **DevTools** (right-click the page → _Inspect_, or `F12`). Click the element-picker, hover over a message bubble, and watch the box model diagram in the _Styles_ / _Computed_ panel. Edit a value live — it doesn't save, but you'll _see_ the box model.

## One thing we're deliberately skipping

CSS has a second major layout system, **Grid** (`display: grid`), for two-dimensional layouts. You'll see it in real code. For now just **recognise** it — flexbox handles everything in our chat UI, and chasing grid fluency isn't worth the time for your goals.

## Stop condition

You're done with this section when you can:

- Open the page, use DevTools to change a message bubble's colour, and add a new message by typing, **and**
- Explain in your own words what HTML, CSS, and JavaScript each contributed to that interaction.

If you can do that, move on to `02-typescript/`. Don't pad.

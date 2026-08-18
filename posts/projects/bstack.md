---
title: "Bstack: Custom Frontend Library & Web Stack"
summary: "A custom reactive frontend library, compiler pipeline (Rust Pest), and SSG/CSR framework beating Svelte and matching Vanilla JS in benchmarks"
coverImage: "/assets/bstack-js-perf.png"
order: 2
---

This is a project I started in June of 2026 because I thought it would be cool to have my own web dev stack and gain more insight into how modern frontend frameworks operate behind the scenes. 

Currently, I am focusing on the frontend library, which is built for multi-page web applications. As of now, it supports CSR (client-side rendering) and SSG (static site generation), with plans to add SSR (server-side rendering) in the future. I also wish to create a more seamless dev experience with either JSX support (like Solid.js) or a custom compiled language (like Svelte), but I probably do not have that much time.

---

## Benchmarks & Analysis

To see how my custom library matches up against industry giants, I ran client-side rendering (CSR) benchmarks using the community-famed `js-framework-benchmark` suite by krausest.

### Summary Comparison Table
The table below displays the geometric mean of all factors (performance slowdown and memory footprint allocation ratios) relative to the baseline Vanilla JS implementation (lower is better, where 1.00 is Vanilla JS baseline):

| Metric | Vanilla JS | Bstack | Svelte v4.0.0 | Vue v3.3.4 | React v18.2.0 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Performance (Duration)** | 1.03 | **1.08** | 1.22 | 1.28 | 1.68 |
| **Memory Allocation** | 1.00 | **1.55** | 1.44 | 1.81 | 2.51 |

### 1. Performance (Duration in ms)
* **Vanilla JS Match**: Bstack achieves a geometric mean score of **1.08** relative to vanilla JS, meaning it has only an **8% overhead** over raw DOM manipulation.
* **Outperforming Svelte, Vue, and React**:
  * **Svelte v4.0.0**: 1.22 geometric mean (Bstack is ~14% faster).
  * **Vue v3.3.4**: 1.28 geometric mean (Bstack is ~20% faster).
  * **React v18.2.0**: 1.68 geometric mean (Bstack is ~60% faster).
* **Key Strengths**: Bstack is exceptionally fast at replacing and swapping rows (1.00 relative score) due to its flat DOM structure and lack of Virtual DOM reconciliation overhead.

![Bstack CSR Performance Benchmarks](/assets/bstack-js-perf.png)

### 2. Memory Footprint (Allocation in MBs)
* **Ultra-low Memory Overhead**: Bstack achieves a geometric mean memory slowdown of **1.55**, putting it in a close tie with Svelte (1.44) and comfortably beating Vue (1.81) and React (2.51).
* **Efficiency**: By avoiding Virtual DOM node duplication, memory remains low even during heavy DOM updates (e.g. updating every 10th row).

![Bstack CSR Memory Benchmarks](/assets/bstack-js-mem.png)

---

## Features & Architecture

Bstack features a modern, portfolio-grade architecture designed for developer speed and execution efficiency:

* **Monorepo Workspaces**: Manages client, server, and playground components under a unified workspace. Setup requires only a single `npm install` at the root.
* **Bstack Developer CLI**: Run `npm run dev` at the root. It spins up the backend server, watches JSS files, and auto-rebuilds JSS templates and Rollup client bundles on the fly.
* **True Server-Side Rendering (SSR)**: Dynamic page resolution fetches request context and URL query parameters at runtime, dynamically instantiating page components and executing them on every request.
* **Live Reloading**: During development, the Node server clears the module require cache on request, reflecting layout and script edits instantly on browser refresh without restarting the server.
* **Microtask Reactivity Batching**: Client state updates are queued and flushed at the end of the microtask execution block (using a scheduler queue). Multiple synchronous state updates trigger only a single layout repaint, preventing DOM thrashing.

---

## Development & Compiler Pipeline

Bstack bridges a custom indentation-based template language with a fine-grained client-side reactive runtime.

### 1. The Compilation Pipeline (Rust DSL)
The compiler is written in **Rust** using the **Pest** parsing library. It parses two custom formats:
* `.jss` (Server Layout): Indentation-based markup defining the structure and components of a page.
* `.jsc` (Client Script): Reactive component script logic.

The compiler generates two build artifacts from these files:
* **Server Components (`.cjs`)**: Exported classes that extend `Component` and produce pre-rendered HTML on the server.
* **Client Components (`.mjs`)**: Exported classes that run in the browser and handle reactivity and DOM binding.

### 2. Client-Side Reactive Runtime
Reactivity is fine-grained, utilizing a signal-like architecture:
* **`StateObject`**: Holds a reactive value and tracks all dependent effects (`ReactiveObjects`).
* **`ReactiveObject`**: Wraps functions that depend on reactive states. When the state changes, the effect is scheduled.
* **Scheduler (Microtask Batching)**: Instead of executing effects synchronously (which causes layout thrashing), updates are queued in a global `Set` and flushed asynchronously at the end of the current microtask tick using `Promise.resolve().then()`.

### 3. Dynamic Server-Side Rendering (SSR) & Hydration
* **Dynamic Loading**: On every HTTP request, the route handler extracts context and query parameters, requiring the corresponding server component file dynamically to render the HTML.
* **Hydration**: The server injects the client scripts. On page load, the client hydrator executes, rebuilding the reactive state bindings on the existing DOM nodes without doing full repaints.

---

## Setup & Local Usage

To run development mode:
1. Clone the repo.
2. Run `npm install` in the root directory (installs all workspace and CLI dependencies).
3. Run `npm run dev` at the project root to start the auto-compiling watcher and backend server.
4. Visit `http://localhost:8000`.

### Replicating js-framework-benchmark tests:
1. Clone and follow the README of [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark). (Make sure to use Chrome v116 rather than v100).
2. Copy the folder `/benchmark-results/Bstack/` (Note: This is a slight modification of `playground/dist/`).
3. Paste the folder into krausest's `frameworks/non-keyed/`.
4. Follow krausest's instructions for benching individual frameworks and compiling results into the tables seen above.

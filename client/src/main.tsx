import React from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("NOVA could not find its application root.");
const application = <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>;
if (root.hasChildNodes()) hydrateRoot(root, application);
else createRoot(root).render(application);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => { void navigator.serviceWorker.register("/service-worker.js").catch(() => undefined); });
}

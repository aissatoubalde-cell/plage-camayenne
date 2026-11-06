import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// VITE_ROUTER=hash sert aux aperçus hébergés sous un sous-chemin ; en production, adresses classiques.
const Router = import.meta.env.VITE_ROUTER === "hash" ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
);

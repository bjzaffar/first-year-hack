import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { FixtureWalkthrough } from "./rendering/FixtureWalkthrough.js";
import "./style.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {location.pathname === "/fixtures/masu" ? <FixtureWalkthrough /> : <App />}
  </StrictMode>,
);

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Disable right-click context menu and common dev tool shortcuts
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("keydown", (e) => {
  if (e.key === "F12") e.preventDefault();
  if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) e.preventDefault();
  if (e.ctrlKey && e.key === "u") e.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);

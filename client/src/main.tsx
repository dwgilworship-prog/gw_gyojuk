import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// 스플래시 스크린 제거
const hideSplash = () => {
  const splash = document.getElementById("splash-screen");
  if (splash) {
    splash.style.opacity = "0";
    splash.style.transform = "scale(1.1)";
    setTimeout(() => splash.remove(), 400);
  }
};

// 최소 800ms 보여주고 제거 (너무 빠르면 깜빡임처럼 보임)
const minDisplayTime = 800;
const startTime = Date.now();

createRoot(document.getElementById("root")!).render(<App />);

// React 렌더링 후 스플래시 제거
requestAnimationFrame(() => {
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, minDisplayTime - elapsed);
  setTimeout(hideSplash, remaining);
});

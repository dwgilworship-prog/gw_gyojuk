import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

// Service Worker 등록 및 업데이트 알림
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("새 버전이 있습니다. 업데이트하시겠습니까?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("앱이 오프라인에서 사용 가능합니다.");
  },
});

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

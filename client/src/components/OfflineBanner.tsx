import { useOnlineStatus } from "@/hooks/use-online-status";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-md"
      style={{ paddingTop: `calc(env(safe-area-inset-top) + 8px)` }}
    >
      <WifiOff className="w-4 h-4" />
      <span>오프라인 모드 - 저장된 데이터를 보고 있습니다</span>
    </div>
  );
}

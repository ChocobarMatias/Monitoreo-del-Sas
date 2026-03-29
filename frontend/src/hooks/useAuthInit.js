import { useEffect } from "react";
import { useAuthStore } from "../store/auth.store";

// Hook de inicialización de autenticación
export function useAuthInit() {
  const loadMe = useAuthStore((s) => s.loadMe);
  useEffect(() => {
    loadMe?.();
    // eslint-disable-next-line
  }, []);
}

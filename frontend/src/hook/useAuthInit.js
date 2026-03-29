import { useEffect } from "react";
import { useAuthStore } from "../store/auth.store";

export function useAuthInit() {
  const loadMe = useAuthStore((state) => state.loadMe);

  useEffect(() => {
    loadMe();
  }, [loadMe]);
}
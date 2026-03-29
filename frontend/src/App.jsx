import { useAuthInit } from "./hooks/useAuthInit";
import { Outlet } from "react-router-dom";

export default function App() {
  useAuthInit();
  return <Outlet />;
}
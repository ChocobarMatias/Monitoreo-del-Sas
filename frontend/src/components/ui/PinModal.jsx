import { useState } from "react";
import { api } from "../../lib/axios";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import { useUIStore } from "../../store/ui.store";

export function PinModal({ open, onClose, onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const setPinValidatedAt = useUIStore((state) => state.setPinValidatedAt);

  async function handleValidate() {
    try {
      await api.post("/auth/validate-pin", { pin });
      setPinValidatedAt();
      setPin("");
      setError("");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || "PIN inválido");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Validar PIN">
      <div className="space-y-4">
        <Input
          label="PIN"
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          error={error}
          placeholder="Ingresa tu PIN"
        />
        <Button className="w-full" onClick={handleValidate}>Validar</Button>
      </div>
    </Modal>
  );
}
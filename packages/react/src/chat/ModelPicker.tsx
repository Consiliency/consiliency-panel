import React from "react";
import { usePanelContext } from "../PanelProvider";

export function ModelPicker() {
  const { betaModelSelection, availableModels, selectedModelId, setSelectedModelId } =
    usePanelContext();

  if (!betaModelSelection || availableModels.length === 0) return null;

  return (
    <div className="panel-model-picker">
      <label className="panel-model-picker-label" htmlFor="panel-model-select">
        Model
      </label>
      <select
        id="panel-model-select"
        className="panel-model-select"
        value={selectedModelId ?? ""}
        onChange={(e) => setSelectedModelId(e.target.value)}
      >
        {availableModels.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label} · {m.provider}
          </option>
        ))}
      </select>
    </div>
  );
}

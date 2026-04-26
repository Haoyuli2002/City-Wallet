import type { ReactNode } from "react";

interface ContextTileProps {
  label: string;
  icon: ReactNode;
  primary: string;
  secondary?: string;
}

export function ContextTile({ label, icon, primary, secondary }: ContextTileProps) {
  return (
    <div className="ctx-tile">
      <div className="ctx-tile__head">
        <span className="ctx-tile__icon">{icon}</span>
        <span className="ctx-tile__lbl">{label}</span>
      </div>
      <div className="ctx-tile__val">
        {primary}
        {secondary ? <em>{secondary}</em> : null}
      </div>
    </div>
  );
}

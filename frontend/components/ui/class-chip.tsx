const CLASS_COLOR: Record<string, string> = {
  US_STOCK: "#7dd3a8",
  BR_STOCK: "#f0c674",
  FII:      "#f0c674",
  CRYPTO:   "#c9f76f",
};
const CLASS_LABEL: Record<string, string> = {
  US_STOCK: "US Stock",
  BR_STOCK: "BR Stock",
  FII:      "FII",
  CRYPTO:   "Crypto",
};

export { CLASS_COLOR, CLASS_LABEL };

export function ClassChip({ assetClass }: { assetClass: string }) {
  const color = CLASS_COLOR[assetClass] ?? "#9ec5fe";
  const label = CLASS_LABEL[assetClass] ?? assetClass;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 7px", borderRadius: 4,
      background: `${color}14`, color, border: `1px solid ${color}30`,
      fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
      fontFamily: "var(--font-mono)", fontWeight: 600,
    }}>{label}</span>
  );
}

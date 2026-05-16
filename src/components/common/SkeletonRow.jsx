const pulse = {
  background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
  backgroundSize: "200% 100%",
  animation: "skeleton-pulse 1.4s ease infinite",
  borderRadius: "6px",
};

export default function SkeletonRow({ cols = 4, rows = 6 }) {
  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} style={{ padding: "12px 16px" }}>
              <div style={{ ...pulse, height: 16, width: c === 0 ? "60%" : "80%" }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

const pulse = {
  background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
  backgroundSize: "200% 100%",
  animation: "skeleton-pulse 1.4s ease infinite",
  borderRadius: "6px",
};

export default function CardSkeleton({ count = 6 }) {
  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ border: "1px solid #eee", borderRadius: 10, padding: 20 }}>
            <div style={{ ...pulse, height: 18, width: "70%", marginBottom: 12 }} />
            <div style={{ ...pulse, height: 13, width: "90%", marginBottom: 8 }} />
            <div style={{ ...pulse, height: 13, width: "60%" }} />
          </div>
        ))}
      </div>
    </>
  );
}

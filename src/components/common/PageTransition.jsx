import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }) {
  const location = useLocation();
  const [phase, setPhase] = useState("idle");
  const [exitContent, setExitContent] = useState(null);
  const prevKey = useRef(location.key);
  const prevChildren = useRef(children);

  // Keep prevChildren current so we can capture it at navigation time.
  // This runs during render (synchronous ref update) so it's always fresh.
  if (phase !== "exit") {
    prevChildren.current = children;
  }

  useEffect(() => {
    if (location.key === prevKey.current) return;
    prevKey.current = location.key;

    // Snapshot the old page before switching to the new one
    setExitContent(prevChildren.current);
    setPhase("exit");

    const exitTimer = setTimeout(() => {
      setPhase("enter");
      const enterTimer = setTimeout(() => setPhase("idle"), 250);
      return () => clearTimeout(enterTimer);
    }, 180);

    return () => clearTimeout(exitTimer);
  }, [location.key]);

  const styles = {
    idle:  { opacity: 1, transform: "translateY(0px)" },
    exit:  { opacity: 0, transform: "translateY(-6px)" },
    enter: { opacity: 0, transform: "translateY(8px)" },
  };

  return (
    <div
      style={{
        transition: "opacity 200ms ease, transform 220ms ease",
        ...styles[phase],
      }}
    >
      {phase === "exit" ? exitContent : children}
    </div>
  );
}

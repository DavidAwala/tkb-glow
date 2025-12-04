import { useEffect, useState } from "react";
import "./loader.css";

const Loader = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage timing
    setTimeout(() => setStage(1), 1200); // Glow + shine
    setTimeout(() => setStage(2), 2300); // Transparent SVG zoom begins
    setTimeout(() => onComplete(), 3600); // Enter home
  }, [onComplete]);

  return (
    <div className="loader-container">
      {/* BACKGROUND VERSION */}
      <img
        src="/logo-nobg.png"   // White background logo
        className={`logo-bg ${stage >= 1 ? "glow" : ""}`}
        alt="logo"
      />

      {/* TRANSPARENT SVG VERSION */}
      <img
        src="/logo-nobg.png"
        className={`logo-transparent ${stage === 2 ? "zoom-in" : ""}`}
        alt="logo"
      />

      {/* Shine Effect */}
      <div className={`shine ${stage >= 1 ? "active" : ""}`} />
    </div>
  );
};

export default Loader;

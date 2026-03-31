import { useEffect, useRef } from "react";

export default function VaultTransition({ onComplete }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => onComplete());
    video.addEventListener("ended", onComplete);
    return () => video.removeEventListener("ended", onComplete);
  }, [onComplete]);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 2000,
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <video
        ref={videoRef}
        src="./assets/vault-opening.mp4"
        muted
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  );
}
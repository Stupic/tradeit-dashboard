"use client";

import { useEffect, useState } from "react";

// 고정 설계 크기로 렌더 후 뷰포트에 맞춰 통째로 스케일(contain).
// → 이미지 비율 그대로 유지 + 스크롤 없음. 16:9 화면은 여백 없이 꽉 참.
// top-left 기준 스케일 + 오프셋을 JS로 계산해 어떤 크기에서도 정확히 맞춘다.
export default function FitScreen({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  const [box, setBox] = useState({ scale: 1, left: 0, top: 0 });

  useEffect(() => {
    const fit = () => {
      const scale = Math.min(window.innerWidth / width, window.innerHeight / height);
      setBox({
        scale,
        left: (window.innerWidth - width * scale) / 2,
        top: (window.innerHeight - height * scale) / 2,
      });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [width, height]);

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: box.left,
          top: box.top,
          width,
          height,
          transform: `scale(${box.scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

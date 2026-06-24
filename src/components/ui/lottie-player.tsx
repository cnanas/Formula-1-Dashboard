"use client";

import { useEffect, useRef, useState } from "react";
import LottieLib, { type LottieRefCurrentProps } from "lottie-react";

interface LottiePlayerProps {
  src: string;
  style?: React.CSSProperties;
}

export function LottiePlayer({ src, style }: LottiePlayerProps) {
  const [animData, setAnimData] = useState<object | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  useEffect(() => {
    fetch(src)
      .then((r) => r.json())
      .then((data) => {
        setAnimData(data);
      })
      .catch(() => {});
  }, [src]);

  useEffect(() => {
    if (animData && lottieRef.current) {
      lottieRef.current.play();
    }
  }, [animData]);

  if (!animData) return null;

  return (
    <LottieLib
      lottieRef={lottieRef}
      animationData={animData}
      loop
      autoplay
      style={style}
    />
  );
}

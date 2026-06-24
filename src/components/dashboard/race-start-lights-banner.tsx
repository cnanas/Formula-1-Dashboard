"use client";

import dynamic from "next/dynamic";
import animationData from "../../../public/animations/race-start-lights.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export function RaceStartLightsBanner() {
  return (
    <div className="w-full flex justify-center">
      <Lottie
        animationData={animationData}
        loop={false}
        style={{ width: 500, height: 140 }}
      />
    </div>
  );
}

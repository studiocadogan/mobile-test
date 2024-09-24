"use client";
import { useRef, useEffect, useState } from "react";
export default function Page() {
  const ref = useRef<HTMLVideoElement>(null);
  const onStart = async () => {
    console.log(navigator.mediaDevices);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
      },
      audio: false,
    });

    setUA(stream.getVideoTracks().map((track) => track.getCapabilities()));

    if (ref.current) {
      ref.current.srcObject = stream;
    }
  };

  const [UA, setUA] = useState<MediaTrackCapabilities[]>([{}]);
  useEffect(() => {
    onStart();
  }, []);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {UA?.length}
        {UA?.map((ua) => Object.values(ua).map((value) => <p>{value}</p>))}
      </div>
      <video
        style={{
          width: "100%",
          maxHeight: "100%",
        }}
        ref={ref}
        autoPlay
        playsInline
        muted
      />
    </>
  );
}

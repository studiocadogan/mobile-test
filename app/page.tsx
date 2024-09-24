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
    });

    setUA(stream.getVideoTracks().map((track) => track.getSettings()));

    if (ref.current) {
      ref.current.srcObject = stream;
    }
  };

  const [UA, setUA] = useState<MediaTrackSettings[]>([{}]);
  useEffect(() => {
    onStart();
  }, []);

  return (
    <>
      <div>
        {UA?.length}
        {UA?.map((ua) => (
          <p key={ua.deviceId}>
            {ua.deviceId} {ua.width}x{ua.height} {ua.frameRate}fps
          </p>
        ))}
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

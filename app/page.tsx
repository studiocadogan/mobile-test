"use client";
import { useRef, useEffect, useState } from "react";
export default function Page() {
  const ref = useRef<HTMLVideoElement>(null);
  const [msg, setMsg] = useState<string[]>([]);
  const onStart = async () => {
    try {
      // Enumerate devices to get all video input devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      for (let device of videoDevices) {
        // Access each camera using getUserMedia
        const constraints = {
          video: {
            deviceId: { exact: device.deviceId },
            width: { ideal: 1920 }, // Common high resolution
            height: { ideal: 1080 }, // Adjust based on known wide-angle characteristics
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();

        console.log(`Device: ${device.label}`);
        console.log(`Resolution: ${settings.width}x${settings.height}`);

        // Heuristic: Check for specific resolution thresholds (adjust as needed)
        if ((settings?.width ?? 0) >= 1920 && (settings?.height ?? 0) >= 1080) {
          setMsg((prev) => [
            ...prev,
            device.deviceId +
              ": This device might be a wide-angle lens based on resolution.",
          ]);
        } else {
          setMsg((prev) => [
            ...prev,
            device.deviceId + ": This device might not be a wide-angle lens",
          ]);
        }

        // Stop the video track
        videoTrack.stop();
      }
    } catch (error) {
      console.error("Error identifying wide-angle lens:", error);
    }

    console.log(navigator.mediaDevices);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
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
        {UA.map((track, i) => (
          <div key={i}>
            {Object.entries(track).map(([key, value]) => (
              <div key={key}>
                {key}: {JSON.stringify(value)}
              </div>
            ))}
          </div>
        ))}
      </div>
      <p>{msg}</p>
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

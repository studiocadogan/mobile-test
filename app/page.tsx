"use client";
import { useRef, useEffect, useState } from "react";
export default function Page() {
  const ref = useRef<HTMLVideoElement>(null);
  const onStart = async () => {
    // const phoneMap = {
    //   iPhone: {
    //     cameraId:
    //   }
    // }
    console.log(navigator.mediaDevices);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
      },
    });

    if (ref.current) {
      ref.current.srcObject = stream;
    }
  };

  const [UA, setUA] = useState([{}]);
  useEffect(() => {
    onStart();
  }, []);

  return (
    <pre>
      {JSON.stringify(UA)}
      <video ref={ref} autoPlay muted />{" "}
    </pre>
  );
}

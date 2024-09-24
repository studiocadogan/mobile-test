"use client";
import { useRef, useEffect, useState } from "react";

// Function to detect distortion or scene coverage from image data
function detectDistortionOrSceneCoverage(imageData: ImageData): boolean {
  const { width, height, data } = imageData;
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  canvas.width = width;
  canvas.height = height;

  // Draw the image data on the canvas to access pixel manipulation functions
  ctx.putImageData(imageData, 0, 0);

  // Step 1: Convert the image to grayscale to simplify edge detection
  const grayScaleData: Uint8ClampedArray = new Uint8ClampedArray(
    width * height
  );
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3; // Average of R, G, B
    grayScaleData[i / 4] = avg; // Store only the grayscale value
  }

  // Step 2: Apply a simple Sobel edge detection to identify edges
  const edges: Uint8ClampedArray = applySobelEdgeDetection(
    grayScaleData,
    width,
    height
  );

  // Step 3: Analyze the detected edges to check for curved lines
  const isCurved: boolean = analyzeCurvature(edges, width, height);

  // Optional: Visualize edges for debugging
  visualizeEdges(edges, width, height);

  // Return true if curvature indicates wide-angle distortion
  return isCurved;
}

// Function to apply Sobel edge detection on grayscale data
function applySobelEdgeDetection(
  grayScaleData: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const sobelX: number[] = [-1, 0, 1, -2, 0, 2, -1, 0, 1]; // Horizontal gradient filter
  const sobelY: number[] = [-1, -2, -1, 0, 0, 0, 1, 2, 1]; // Vertical gradient filter
  const edges: Uint8ClampedArray = new Uint8ClampedArray(width * height);

  // Apply convolution with Sobel filters
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = grayScaleData[(y + ky) * width + (x + kx)];
          gx += pixel * sobelX[(ky + 1) * 3 + (kx + 1)];
          gy += pixel * sobelY[(ky + 1) * 3 + (kx + 1)];
        }
      }
      // Calculate the magnitude of the gradient
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[y * width + x] = magnitude > 128 ? 255 : 0; // Threshold to create a binary edge map
    }
  }
  return edges;
}

// Function to analyze curvature of detected edges
function analyzeCurvature(
  edges: Uint8ClampedArray,
  width: number,
  height: number
): boolean {
  let curvedLines = 0;
  let totalLines = 0;

  // Simple heuristic: Count pixels in curved areas vs. straight areas
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const edgePixel = edges[y * width + x];
      if (edgePixel === 255) {
        // Check adjacent pixels to see if the line is straight or curved
        const left = edges[y * width + (x - 1)];
        const right = edges[y * width + (x + 1)];
        const top = edges[(y - 1) * width + x];
        const bottom = edges[(y + 1) * width + x];

        // If edges are not aligned, count as curvature
        if (
          !(left === 255 && right === 255) ||
          !(top === 255 && bottom === 255)
        ) {
          curvedLines++;
        }
        totalLines++;
      }
    }
  }

  // Heuristic threshold: If a significant portion of lines are curved, it's likely a wide-angle lens
  const curvatureRatio = curvedLines / (totalLines || 1);
  return curvatureRatio > 0.2; // Threshold can be adjusted based on testing
}

// Optional visualization function to render detected edges on a canvas
function visualizeEdges(
  edges: Uint8ClampedArray,
  width: number,
  height: number
): void {
  const edgeCanvas: HTMLCanvasElement = document.createElement("canvas");
  const edgeCtx = edgeCanvas.getContext("2d") as CanvasRenderingContext2D;
  edgeCanvas.width = width;
  edgeCanvas.height = height;
  document.body.appendChild(edgeCanvas);

  // Create ImageData to render the edge detection result
  const edgeImageData = edgeCtx.createImageData(width, height);
  for (let i = 0; i < edges.length; i++) {
    const value = edges[i];
    edgeImageData.data[i * 4] = value;
    edgeImageData.data[i * 4 + 1] = value;
    edgeImageData.data[i * 4 + 2] = value;
    edgeImageData.data[i * 4 + 3] = 255; // Full opacity
  }
  edgeCtx.putImageData(edgeImageData, 0, 0);
}

export default function Page() {
  const ref = useRef<HTMLVideoElement>(null);

  async function analyzeCameraFoV() {
    try {
      // Step 1: Enumerate all video input devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) =>
          device.kind === "videoinput" &&
          device.label.toLowerCase().includes("back")
      );

      // Step 2: Loop through each device and analyze
      for (const device of videoDevices) {
        console.log(`Analyzing Device: ${device.label}`);

        // Access the camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: device.deviceId } },
        });

        // Create a video element to play the stream
        const video = document.createElement("video");
        video.srcObject = stream;
        ref.current!.srcObject = stream;
        await video.play();

        console.log("video playing");

        // Wait for the video to start playing

        // Create a canvas to capture the frame
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");

        // Draw the current frame onto the canvas
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Optionally display the canvas (for debugging)
        document.body.appendChild(canvas);

        // Analyze the captured frame
        // (Here, you could add more advanced analysis for distortion or scene coverage)
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        console.log(
          `Captured Frame Dimensions: ${canvas.width}x${canvas.height}`
        );

        // Example heuristic: if image appears distorted, it might indicate a wide-angle lens
        // Placeholder for distortion detection logic:
        const isWideAngle = detectDistortionOrSceneCoverage(imageData!);
        console.log(
          isWideAngle
            ? "Detected as Wide-Angle Lens"
            : "Not Detected as Wide-Angle"
        );

        // Clean up: stop the video stream and remove canvas
        video.srcObject = null;
        stream.getTracks().forEach((track) => track.stop());
        canvas.remove();
      }
    } catch (error) {
      console.error("Error analyzing camera FoV:", error);
    }
  }

  useEffect(() => {
    analyzeCameraFoV();
  }, []);

  return (
    <>
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

import React, { useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/-mc0dEy3L/ "; 

export default function WebcamDetect() {
  const webcamRef = useRef(null);
  const [label, setLabel] = useState("");
  const modelRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const modelURL = MODEL_URL + "model.json";
      const metadataURL = MODEL_URL + "metadata.json";

      modelRef.current = await tmImage.load(modelURL, metadataURL);
      const webcam = new tmImage.Webcam(200, 200, true);
      await webcam.setup();
      await webcam.play();
      webcamRef.current = webcam;
      window.requestAnimationFrame(loop);
    };

    init();
  }, []);

  const loop = async () => {
    if (webcamRef.current) {
      webcamRef.current.update();
      await predict();
      window.requestAnimationFrame(loop);
    }
  };

  const predict = async () => {
    const prediction = await modelRef.current.predict(webcamRef.current.canvas);
    prediction.sort((a, b) => b.probability - a.probability);
    const top = prediction[0];

    setLabel(`${top.className} (%${(top.probability * 100).toFixed(1)})`);
  };

  return (
    <div>
      <h2>Algılanan Nesne:</h2>
      <p>{label}</p>
      <canvas
        ref={(el) => {
          if (webcamRef.current) webcamRef.current.canvas = el;
        }}
      />
    </div>
  );
}

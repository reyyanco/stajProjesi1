import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

const WebcamComponent = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const handDetectorRef = useRef(null);
  const objectDetectorRef = useRef(null);

  // detectFrame fonksiyonunu, useRef ve useState tanımlarından SONRA,
  // ancak useEffect hook'undan ÖNCE veya SONRA, ana bileşen fonksiyonunun
  // doğrudan içinde tanımladığınızdan emin olun.
  // Burada, useEffect'ten sonra tanımlamak daha okunur bir yapıdır.
  const detectFrame = async () => {
    if (videoRef.current && canvasRef.current && modelsLoaded) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // --- El Tespiti ---
      if (handDetectorRef.current) {
        const hands = await handDetectorRef.current.estimateHands(video);
        if (hands.length > 0) {
          console.log("Tespit Edilen Eller:", hands);
          hands.forEach(hand => {
            hand.keypoints.forEach(keypoint => {
              ctx.beginPath();
              ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
              ctx.fillStyle = 'red';
              ctx.fill();
            });
          });
        }
      }

      // --- Nesne Tespiti (COCO-SSD ile test) ---
      if (objectDetectorRef.current) {
        const predictions = await objectDetectorRef.current.detect(video);
        if (predictions.length > 0) {
          console.log("Tespit Edilen Nesneler:", predictions);
          predictions.forEach(prediction => {
            ctx.beginPath();
            ctx.rect(prediction.bbox[0], prediction.bbox[1], prediction.bbox[2], prediction.bbox[3]);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'green';
            ctx.fillStyle = 'green';
            ctx.stroke();
            ctx.fillText(
              `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
              prediction.bbox[0],
              prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10
            );
          });
        }
      }
    }
    requestAnimationFrame(detectFrame);
  }; // detectFrame fonksiyonunun bittiği yer

  // useEffect hook'u burada başlıyor
  useEffect(() => {
const loadModels = async () => {
        try {
            console.log('TensorFlow.js backend başlatılıyor...');
            // TensorFlow.js'in en uygun backend'i (WebGPU, WebGL, sonra CPU) otomatik olarak seçmesini sağlar.
            // Bu, en uyumlu ve genellikle en iyi performansı veren seçenektir.
            await tf.ready();
            
            // Hata ayıklama için hangi backend'in seçildiğini konsola yazdırıyoruz.
            console.log('TensorFlow.js backend başarıyla başlatıldı:', tf.getBackend());

            console.log('El tespiti modeli yükleniyor...');
            // MediaPipeHands modelini yüklüyoruz.
            // runtime: 'mediapipe' ve modelType: 'lite' belirtiyoruz.
            // solutionPath'i kaldırdık, kütüphane varsayılan CDN yolunu kullanacak.
            handDetectorRef.current = await handPoseDetection.createDetector(
                handPoseDetection.SupportedModels.MediaPipeHands,
                {
                    runtime: 'mediapipe',
                    modelType: 'lite' 
                }
            );
            console.log('El tespiti modeli yüklendi.');

            console.log('Nesne tespiti modeli yükleniyor (COCO-SSD)...');
            // COCO-SSD nesne tespiti modelini yüklüyoruz.
            objectDetectorRef.current = await cocoSsd.load();
            console.log('Nesne tespiti modeli yüklendi (COCO-SSD).');

            // Tüm modeller başarıyla yüklendiğinde durumu güncelliyoruz.
            setModelsLoaded(true);
            console.log('Tüm yapay zeka modelleri yüklendi.');

            // Kamera akışını başlat
            if (videoRef.current) {
                try {
                    // Kullanıcının kamerasından video akışı alıyoruz.
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    videoRef.current.srcObject = stream;
                    
                    // Video meta verileri yüklendiğinde (videonun boyutları gibi)
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play(); // Videoyu oynatmaya başla
                        // Video oynatmaya başladıktan sonra tespit döngüsünü başlat
                        // Bu, her karede el ve nesne tespiti yapacak fonksiyon.
                        requestAnimationFrame(detectFrame);
                    };
                } catch (error) {
                    // Kamera erişiminde bir hata olursa kullanıcıya bilgi ver.
                    console.error("Webcam erişim hatası: ", error);
                    alert("Webcam'e erişim izni verilmedi veya bir hata oluştu. Lütfen izin verin.");
                }
            }
        } catch (error) {
            // Modeller yüklenirken veya backend başlatılırken oluşan genel hataları yakala.
            console.error("Yapay zeka modelleri yüklenirken veya backend başlatılırken kritik bir hata oluştu: ", error);
            alert("Uygulamayı başlatırken kritik bir hata oluştu. Lütfen tarayıcı konsolunu kontrol edin (F12).");
        }
    };
    loadModels();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline width={640} height={480} style={{ display: 'none' }} />
      <canvas ref={canvasRef} width={640} height={480} />
      {!modelsLoaded && <p>Yapay Zeka Modelleri Yükleniyor...</p>}
    </div>
  );
};

export default WebcamComponent;
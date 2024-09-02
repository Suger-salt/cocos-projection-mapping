"use client"; // クライアントコンポーネントとして指定

import { useState, useEffect, useRef } from "react";
import './page.css'

// const fontLink = `
// <style>
// @import url('https://fonts.googleapis.com/css2?family=Darumadrop+One&display=swap');
// .darumadrop-one-regular {
//   font-family: "Darumadrop One", sans-serif;
//   font-weight: 400;
//   font-style: normal;
// }
// </style>
// `;


export default function Home() {
  const [images, setImages] = useState([]);
  const [positions, setPositions] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [displayedImages, setDisplayedImages] = useState([]);
  const [numDisplay, setNumDisplay] = useState(20); // 表示する枚数を管理する状態
  const intervalRef = useRef(null);
  const currentIndexRef = useRef(0); // 現在のインデックスをuseRefで管理

  // 画面の幅と高さを管理するref
  const widthRef = useRef(0);
  const heightRef = useRef(0);

  useEffect(() => {
    // 初期サイズの取得
    widthRef.current = document.documentElement.clientWidth;
    heightRef.current = document.documentElement.clientHeight;
  }, []);

  const handleFolderSelect = async (event) => {
    setLoading(true);
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(
      (file) => file.type.startsWith("image/") || file.type === "image/heic"
    );

    setProgress(0);

    const imageUrls = await Promise.all(
      imageFiles.map(async (file, index) => {
        setProgress(((index + 1) / imageFiles.length) * 50);
        return {
          url: URL.createObjectURL(file),
          name: file.name,
        };
      })
    );

    const validImageUrls = imageUrls.filter((image) => image.url !== null);
    const processedImages = await Promise.all(
      validImageUrls.map((image, index) =>
        makeImageTransparent(image.url).then((processedUrl) => {
          setProgress(50 + ((index + 1) / validImageUrls.length) * 50);
          return { url: processedUrl, name: image.name };
        })
      )
    );

    // 初期位置をランダム生成
    const initialPositions = processedImages.map(() => ({
      x: Math.random() * widthRef.current,
      y: Math.random() * heightRef.current,
      speedX: (Math.random() - 0.5) * 2, // X方向のスピードを大きく調整
      speedY: (Math.random() - 0.5) * 2, // Y方向のスピードを大きく調整
    }));

    setImages(processedImages);
    setPositions(initialPositions);
    setLoading(false);
  };

  //背景透過してるけど、いらなくね？
  const makeImageTransparent = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL());
      };
    });
  };

  useEffect(() => {
    //ランダムな画像を表示し、その画像のx,yをランダムに変更
    if (images.length > 0) {
      const initialDisplay = images.slice(0, numDisplay);
      setDisplayedImages(initialDisplay);

      intervalRef.current = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * images.length);
        const newImage = images[randomIndex];

        setDisplayedImages((prevImages) => {
          const updatedImages = [...prevImages];
          updatedImages[currentIndexRef.current] = newImage;
          return updatedImages;
        });

        currentIndexRef.current = (currentIndexRef.current + 1) % numDisplay;
      }, 2000);

      return () => clearInterval(intervalRef.current);
    }
  }, [images, numDisplay]);

  useEffect(() => {
    let animationFrameId;
    //アニメーションの実行
    const animate = () => {
      setPositions((prevPositions) =>
        prevPositions.map((pos) => {
          let newX = pos.x + pos.speedX;
          let newY = pos.y + pos.speedY;

          // 画面の端に到達した場合は方向を反転
          if (newX < 0 || newX > widthRef.current - 200) {
            pos.speedX *= -1;
            newX = pos.x + pos.speedX;
          }
          if (newY < 0 || newY > heightRef.current - 200) {
            pos.speedY *= -1;
            newY = pos.y + pos.speedY;
          }

          return {
            ...pos,
            x: newX,
            y: newY,
          };
        })
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [displayedImages]);

  const removeExtension = (filename) => {
    return filename.split('.').slice(0, -1).join('.');
  };

  return (
    <div>
      <input
        type="file"
        webkitdirectory="true"
        mozdirectory="true"
        directory="true"
        multiple
        onChange={handleFolderSelect}
      />
      {loading && (
        <progress
          value={progress}
          max="100"
          style={{ width: "100%", height: "30px", marginTop: "10px" }}
        >
          {progress}%
        </progress>
      )}
      <div >
        <label>
          表示数:
          <input
            type="number"
            value={numDisplay}
            onChange={(e) => setNumDisplay(parseInt(e.target.value, 10))}
            min="1"
            max="100"
          />
        </label>
        
      </div>
      
      <div
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
         
        }}
      >
        {displayedImages.map((image, index) => (
          <div key={index} style={{ position: "absolute", left: `${positions[index]?.x}px`, top: `${positions[index]?.y}px` }}>
            <img
              src={image.url}
              alt={`image-${index}`}
              style={{
                width: "200px",
                height: "200px",
                objectFit: "cover",
                transition: "left 2s linear, top 2s linear, opacity 1s ease-in-out",
                opacity: 1,
                pointerEvents: "none",
              }}
            />
            <div className="image-name">{removeExtension(image.name)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

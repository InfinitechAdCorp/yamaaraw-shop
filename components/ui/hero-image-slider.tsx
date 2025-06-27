"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const heroImages = ["/v9-tricycle.png", "/t20.png", "/cyborg.png"];

export default function HeroImageSlider() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 3000); // Auto slide every 3 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full">
      {heroImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImage ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={image || "/placeholder.svg"}
            alt={`Electric Vehicle ${index + 1}`}
            fill
            className="object-contain"
            priority={index === 0}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      ))}

      {/* Simple Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImage(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentImage ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

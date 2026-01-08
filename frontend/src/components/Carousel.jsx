import { useEffect, useState } from "react";

const slides = [
  {
    title: "Kue Premium",
    subtitle: "Spesial untuk momen terbaikmu",
    image: "/cakes/cover.jpg",
  },
  {
    title: "Macaron & Tart Lezat",
    subtitle: "Rasa autentik dari bahan terbaik",
    image: "/cakes/tart.jpg",
  },
  {
    title: "Harga Terjangkau",
    subtitle: "Nikmati kue berkualitas tanpa merogoh kocek dalam",
    image: "/cakes/cover2.jpg",
  },
  {
    title: "Pesan Mudah Online",
    subtitle: "Kue favoritmu, diantar langsung ke depan pintu",
    image: "/cakes/cover3.jpg",
  }
];

export default function Carousel() {
  const [current, setCurrent] = useState(0);

  // 🔁 auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000); // 4 detik

    return () => clearInterval(interval);
  }, []);

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative h-96 md:h-[60vh] overflow-hidden">
      {/* image */}
      <img
        src={slides[current].image}
        alt={slides[current].title}
        className="w-full h-full object-cover transition-all duration-700"
      />

      {/* overlay */}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {slides[current].title}
          </h1>
          <p className="text-xl md:text-3xl">
            {slides[current].subtitle}
          </p>
        </div>
      </div>

      {/* LEFT ARROW */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 
                   bg-black/40 hover:bg-black/60 
                   text-white w-12 h-12 rounded-full 
                   flex items-center justify-center
                   text-2xl transition"
      >
        ‹
      </button>

      {/* RIGHT ARROW */}
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 
                   bg-black/40 hover:bg-black/60 
                   text-white w-12 h-12 rounded-full 
                   flex items-center justify-center
                   text-2xl transition"
      >
        ›
      </button>
    </div>
  );
}

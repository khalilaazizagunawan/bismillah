import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import ProductCard from '../components/ui/ProductCard';
import Carousel from '../components/Carousel';
import { GET_CAKES } from '../graphql/cakes';

function Home() {
  const { data, loading, error } = useQuery(GET_CAKES, {
    variables: { activeOnly: true },
    fetchPolicy: 'cache-and-network',
  });

  // Ambil 4 produk pertama sebagai produk unggulan
  const featured = data?.cakes?.slice(0, 4) || [];

  // Array foto slider toko
  const slides = [
    "/toko/toko3.jpg",
    "/toko/toko2.jpg",
    "/toko/toko4.jpg",
    "/toko/toko1.jpg",
  ];

  const [current, setCurrent] = useState(0);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Carousel />

      {/* Tentang Kami*/}
      <section className="relative py-24 overflow-hidden bg-white">
        <div className="absolute top-10 left-10 w-20 h-20 bg-pink-500 rounded-full opacity-60"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-pink-500 rounded-full opacity-50"></div>
        <div className="absolute bottom-20 left-32 w-24 h-24 bg-pink-500 rounded-full opacity-40"></div>
        <div className="absolute top-1/2 right-10 w-12 h-12 bg-pink-500 rounded-full opacity-70"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute -left-20 -bottom-10 w-96 h-96 bg-pink-500 rounded-full"></div>
              <img
                src="/public/cakes/tentang.jpg"
                alt="Kue SweetCake"
                className="relative z-10 w-full max-w-lg object-contain drop-shadow-2xl"
              />
            </div>

            {/* Teks About Us */}
            <div className="text-center lg:text-left">
              <h2 className="text-5xl font-bold text-pink-700 mb-8">TENTANG KAMI</h2>
              <div className="text-lg text-gray-700 space-y-6 max-w-2xl">
                <p>
                  SweetCake didirikan pada tahun 1945 dengan komitmen untuk menghadirkan kue homemade yang lezat dan berkualitas tinggi.
                </p>
                <p>
                  Kami menggunakan bahan-bahan premium terbaik serta resep turun-temurun untuk menciptakan kue yang tidak hanya menarik secara visual, tetapi juga unggul dalam cita rasa.
                </p>
                <p>
                  Setiap kue dibuat secara fresh sesuai pesanan, sehingga pelanggan selalu mendapatkan kualitas dan rasa terbaik untuk setiap momen spesial bersama keluarga dan kerabat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Produk Unggulan */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12 text-pink-700">Produk Unggulan</h2>
        {loading ? (
          <div className="text-center py-20">Loading...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-600">Error: {error.message}</div>
        ) : featured.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Belum ada produk unggulan</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Hubungi Kami + Slider Foto Toko */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-pink-700">Hubungi Kami</h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">

            {/* Informasi Kontak */}
            <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col justify-center">
              <h3 className="text-2xl font-semibold mb-6">Informasi Kontak</h3>
              <div className="space-y-4 text-gray-700">
                <p><strong>Alamat:</strong> Jl. Biznet No. 120, Buah Batu</p>
                <p>
                  <strong>WhatsApp:</strong>{' '}
                  <a href="https://wa.me/6281234567890" className="text-primary hover:underline">
                    0812-3456-7890
                  </a>
                </p>
                <p><strong>Email:</strong> bebek@sweetcake.id</p>
                <p><strong>Jam Operasional:</strong> Senin - Minggu, 08:00 - 20:00 WIB</p>
              </div>
            </div>

            {/* Slider Foto Toko */}
            <div className="relative rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${current * 100}%)` }}
                >
                  {slides.map((slide, index) => (
                    <div key={index} className="min-w-full h-96">
                      <img
                        src={slide}
                        alt={`Foto toko SweetCake ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 z-10"
              >
                &#8249;
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 z-10"
              >
                &#8250;
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrent(index)}
                    className={`w-3 h-3 rounded-full transition ${index === current ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
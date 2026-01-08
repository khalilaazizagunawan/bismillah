function Contact() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-12">Hubungi Kami</h1>
      <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
        <div>
          <h2 className="text-2xl font-semibold mb-6">Informasi Kontak</h2>
          <p className="mb-4"><strong>Alamat:</strong> Jl. Contoh No. 123, Jakarta Selatan</p>
          <p className="mb-4"><strong>WhatsApp:</strong> 0812-3456-7890</p>
          <p className="mb-4"><strong>Email:</strong> info@sweetcake.id</p>
          <p><strong>Jam Operasional:</strong> Senin - Minggu, 08:00 - 20:00 WIB</p>
        </div>
        <div className="bg-gray-200 h-96 rounded-xl flex items-center justify-center">
          <p className="text-gray-600">Tempat untuk Google Maps embed (tambahkan iframe nanti)</p>
        </div>
      </div>
    </section>
  );
}

export default Contact;
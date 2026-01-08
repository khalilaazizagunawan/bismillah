import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

function ProductCard({ product }) {
  const { addToCart } = useCart();

  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-full transition-shadow hover:shadow-xl">
      {/* Gambar Kue - Klikable ke Detail */}
      <Link to={`/produk/${product.id}`} className="block">
        {product.image_url || product.image ? (
          (() => {
            const raw = product.image_url || product.image;
            // Only prepend backend URL for paths that don't look like static frontend assets
            const isStaticAsset = raw.startsWith('/cakes') || raw.startsWith('/toko') || raw.startsWith('/public');
            const src = raw && raw.startsWith('/') && !isStaticAsset ? `http://localhost:4000${raw}` : raw;
            return (
              <img
                src={src}
                alt={product.name}
                className="w-full h-72 object-cover"
              />
            );
          })()
        ) : (
          <div className="w-full h-72 bg-gray-200 flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}
      </Link>

      {/* Info Produk - Mengisi sisa tinggi card */}
      <div className="p-6 flex flex-col flex-grow justify-between">
        <div className="text-center">
          {/* Nama Kue - Besar & Bold */}
          <Link to={`/produk/${product.id}`}>
            <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-2">
              {product.name}
            </h3>
          </Link>

          {/* Harga */}
          <p className="text-lg font-medium text-gray-700 mb-6">
            {formatPrice(product.price)}
          </p>
        </div>

        {/* Tombol Add to Cart - Full Width Pill */}
        <button
          onClick={() => addToCart(product)}
          className="w-full bg-primary text-white font-medium py-3 px-6 rounded-full hover:bg-secondary transition duration-300 uppercase tracking-wider"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
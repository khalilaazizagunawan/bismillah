import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_CAKE } from '../graphql/cakes';
import { useCart } from '../context/CartContext';

function ProductDetail() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(GET_CAKE, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });

  const { addToCart } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (error) return <div className="text-center py-20 text-red-600">Error: {error.message}</div>;

  const product = data?.cake;

  if (!product) {
    return <div className="text-center py-20">Produk tidak ditemukan</div>;
  }

  // Distinguish between frontend static assets (/cakes, /toko) and backend uploaded images
  const rawImage = product.image_url || product.image || "";
  const isStatic = rawImage.startsWith('/cakes') || rawImage.startsWith('/toko') || rawImage.startsWith('/public');

  // If it's a relative path starting with / but NOT a static asset, prepend backend URL
  const imageUrl = (rawImage.startsWith('/') && !isStatic)
    ? `http://localhost:4000${rawImage}`
    : rawImage;

  // Prepare product for cart (ensure it has all required fields)
  const cartProduct = {
    id: product.id,
    name: product.name,
    price: product.price,
    description: product.description || '',
    image: imageUrl || '',
    image_url: imageUrl || '',
  };

  const handleAddToCart = () => {
    addToCart(cartProduct);
  };

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full rounded-xl shadow-lg"
              data-raw={rawImage}
              data-static={isStatic ? "true" : "false"}
              data-final={imageUrl}
            />
          ) : (
            <div className="w-full h-96 bg-gray-200 flex items-center justify-center text-gray-500 rounded-xl">
              No Image
            </div>
          )}
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
          <p className="text-2xl font-bold text-primary mb-6">{formatPrice(product.price)}</p>
          {product.description && (
            <p className="text-gray-700 mb-8 leading-relaxed">{product.description}</p>
          )}
          <div className="mb-6">
            <p className="text-gray-600 text-sm mb-2">Stock: {product.stock}</p>
          </div>
          <button
            onClick={handleAddToCart}
            className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-secondary transition w-full md:w-auto"
          >
            Tambah ke Keranjang
          </button>
        </div>
      </div>
    </section>
  );
}

export default ProductDetail;
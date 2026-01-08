import ProductCard from "../components/ui/ProductCard";
import { useQuery } from "@apollo/client";
import { GET_CAKES } from "../graphql/cakes";

function Catalog() {
  const { data, loading, error } = useQuery(GET_CAKES, {
    variables: { activeOnly: true },
    fetchPolicy: "network-only",
  });

  if (loading) return <div className="py-16 text-center">Loading...</div>;
  if (error) return <div className="py-16 text-center text-red-500">{error.message}</div>;

  const products = (data?.cakes ?? []).map((c) => ({
    id: Number(c.id),
    name: c.name,
    description: c.description,
    price: c.price,
    stock: c.stock,
    image: c.image_url || "/cakes/default.jpg", // fallback
  }));

  return (
    <section className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">
        Katalog Kue
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default Catalog;

import { Link } from '@tanstack/react-router';

interface ProductCardProps {
  product: {
    id: string;
    title?: string;
    name?: string;
    priceEtb?: number;
    price?: number;
    category: string;
    images?: string[];
    image?: string;
    stockQuantity?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const title = product.title || product.name || 'Untitled Product';
  const price = product.priceEtb ?? product.price ?? 0;
  const image = (product.images && product.images[0]) || product.image;

  return (
    <Link to="/product/$id" params={{ id: product.id }} className="block group">
      <div className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 border border-slate-200/80 flex flex-col h-full">
        <div className="aspect-square bg-slate-100 overflow-hidden relative">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              No Image
            </div>
          )}
          {product.stockQuantity !== undefined && product.stockQuantity <= 0 && (
            <span className="absolute top-2 right-2 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow">
              Out of Stock
            </span>
          )}
        </div>
        <div className="p-3.5 flex-1 flex flex-col justify-between">
          <div>
            <span className="text-[11px] text-sky-600 font-bold uppercase tracking-wider">{product.category}</span>
            <h3 className="text-sm font-semibold text-slate-900 mt-1 truncate" title={title}>{title}</h3>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-sm font-bold text-sky-700">
              ETB {price.toLocaleString()}
            </p>
            {product.stockQuantity !== undefined && product.stockQuantity > 0 && (
              <span className="text-[11px] text-emerald-600 font-medium">{product.stockQuantity} in stock</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

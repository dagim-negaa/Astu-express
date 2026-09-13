import { createFileRoute, Link } from '@tanstack/react-router';
import { useCart } from '../hooks/useCart';
import { StorefrontLayout } from '../components/storefront/StorefrontLayout';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/cart')({
  component: CartComponent,
});

function CartComponent() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <StorefrontLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-20 h-20 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={36} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Your Shopping Cart is Empty</h1>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Discover premium Ethiopian garments and accessories in our online catalog.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-sky-500 transition-colors shadow-sm"
          >
            Continue Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.size}-${item.color}`}
                className="bg-white rounded-2xl p-4 flex gap-4 border border-slate-200 shadow-sm items-center"
              >
                <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Image</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.size !== 'Standard' && `Size: ${item.size}`}
                    {item.color !== 'Standard' && ` • Color: ${item.color}`}
                  </p>
                  <p className="text-sm font-bold text-sky-700 mt-1">ETB {item.price.toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button
                    onClick={() => removeItem(item.productId, item.size, item.color)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                      className="p-1.5 text-slate-600 hover:bg-slate-200"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="px-3 text-xs font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                      className="p-1.5 text-slate-600 hover:bg-slate-200"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2">
              <button onClick={clearCart} className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                Clear All Cart Items
              </button>
              <Link to="/shop" className="text-xs font-semibold text-sky-600 hover:text-sky-700">
                + Add More Products
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-fit">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">ETB {totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ethiopian Shipping</span>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Calculated at Checkout</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-slate-900">Total Price</span>
                <span className="text-xl font-black text-sky-700">ETB {totalPrice.toLocaleString()}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="block w-full mt-6 bg-sky-600 text-white text-center py-3.5 rounded-xl font-bold text-sm hover:bg-sky-500 transition-colors shadow-sm"
            >
              Proceed to Checkout →
            </Link>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Accepting Telebirr, CBE Birr, and Cash on Delivery
            </p>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}

import { createFileRoute, Link } from '@tanstack/react-router';
import { StorefrontLayout } from '../components/storefront/StorefrontLayout';
import { ArrowLeft, Shield } from 'lucide-react';

export const Route = createFileRoute('/privacy')({
  component: PrivacyComponent,
});

function PrivacyComponent() {
  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 mb-6 text-sm font-semibold">
          <ArrowLeft size={16} /> Back to Storefront
        </Link>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
              <p className="text-xs text-slate-400 mt-0.5">R2 Express Ethiopian Shipping & Mini ERP</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6 text-slate-600">
            <p>
              At <strong>R2 Express</strong>, we are committed to protecting the privacy and personal data of our customers,
              partners, and staff across Ethiopia. This Privacy Policy details how we collect, store, and utilize information
              in connection with our storefront, order processing, and shipping center operations.
            </p>

            <h3 className="text-base font-bold text-slate-900">1. Information We Collect</h3>
            <p>
              When you place an order or create an account with R2 Express, we collect essential details required for delivery:
              customer full name, Ethiopian phone number, email address, physical delivery address (city/woreda/landmark),
              and preferred payment method (Telebirr, CBE Birr, or Cash on Delivery).
            </p>

            <h3 className="text-base font-bold text-slate-900">2. How We Use Your Data</h3>
            <p>
              Your personal data is used solely to process your orders, schedule local couriers, verify payments, and keep you
              informed regarding shipment milestones. We do not sell or lease your personal information to third-party advertisers.
            </p>

            <h3 className="text-base font-bold text-slate-900">3. Data Security & Storage</h3>
            <p>
              All customer records and transactions are securely encrypted. Cloudflare R2 object storage is utilized for digital assets,
              and strict Role-Based Access Control (RBAC) ensures only authorized internal staff (Owner, Admin, Manager, Operator)
              can view operational order information.
            </p>

            <h3 className="text-base font-bold text-slate-900">4. Contacting Us</h3>
            <p>
              If you have any questions regarding your account or order information, please reach out via phone at +251 91 123 4567
              or visit our central shipping hub in Addis Ababa, Ethiopia.
            </p>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}

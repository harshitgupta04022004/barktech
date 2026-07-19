import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/images/bark-logo.png" alt="Bark Technologies" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-gray-400">Emerging & growing company in post press equipment solutions &amp; machinery in India. Trusted since 2019.</p>
            <p className="text-xs text-gray-500 mt-3">UDYAM-UP-28-0004163</p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Products</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products?category=Die+Cutting+%26+Creasing" className="hover:text-white transition-colors">Die Cutting Machines</Link></li>
              <li><Link to="/products?category=Flute+Laminating" className="hover:text-white transition-colors">Flute Laminators</Link></li>
              <li><Link to="/products?category=Window+Patching" className="hover:text-white transition-colors">Window Patching</Link></li>
              <li><Link to="/products?category=Printing" className="hover:text-white transition-colors">Rotary Printers</Link></li>
              <li><Link to="/creasing-matrix" className="hover:text-white transition-colors">Creasing Matrix</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/case-studies" className="hover:text-white transition-colors">Case Studies</Link></li>
              <li><Link to="/news" className="hover:text-white transition-colors">News</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/installations" className="hover:text-white transition-colors">Installations</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/inquiry" className="hover:text-white transition-colors">Request Quote</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5 flex-shrink-0" /> +91 8810597980</li>
              <li className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5 flex-shrink-0" /> info@barktechnologies.in</li>
              <li className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5 flex-shrink-0" /> sales1@barktechnologies.in</li>
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" /> SF-03, Shushat Aquapolis, Ghaziabad - 201009, UP</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Bark Technologies. All Rights Reserved. UDYAM-UP-28-0004163
        </div>
      </div>
    </footer>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, CheckSquare, CreditCard, ShoppingBag, 
  Car, MessageSquare, ArrowRight, UserCheck 
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="bg-white min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-50 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-green-600 tracking-tight">ApartmentHub</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-all">Sign In</Link>
          <Link to="/register" className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-all shadow-sm">Get Started</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center">
        <span className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full font-bold tracking-wider uppercase mb-4">Residential Platform</span>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
          Smart Living. <br />
          <span className="text-green-600">Connected Community.</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl">
          ApartmentHub is a residential management platform connecting residents, property managers, security gates, and local service providers.
        </p>
        <div className="mt-8 flex gap-4">
          <Link to="/register" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md">
            Join Your Community <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="border border-gray-200 hover:bg-gray-55 text-gray-700 px-6 py-3 rounded-lg font-bold transition-all">
            Login
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900">Modern Residential Solutions</h2>
            <p className="mt-2 text-gray-500">Everything you need to manage your community life in one interface.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <Shield size={24} />
              </div>
              <h3 className="font-bold text-lg text-gray-800">Visitor Gate Pass</h3>
              <p className="text-sm text-gray-500">Generate secure gate passes for visitors, track package deliveries, and log gate entries.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <CheckSquare size={24} />
              </div>
              <h3 className="font-bold text-lg text-gray-800">Maintenance Tickets</h3>
              <p className="text-sm text-gray-500">Raise maintenance support requests, track technician assignments, and check task timeline logs.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <CreditCard size={24} />
              </div>
              <h3 className="font-bold text-lg text-gray-800">Billing & Payments</h3>
              <p className="text-sm text-gray-500">View maintenance dues, parking fees, event costs, and process mock invoice checkouts.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <ShoppingBag size={24} />
              </div>
              <h3 className="font-bold text-lg text-gray-800">Classifieds Marketplace</h3>
              <p className="text-sm text-gray-500">Buy/Sell second-hand items, rent utilities, borrow, or list lost-and-found items.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <Car size={24} />
              </div>
              <h3 className="font-bold text-lg text-gray-800">Parking Management</h3>
              <p className="text-sm text-gray-500">Register vehicles, verify parking slot occupancy, and file slot parking violations.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <MessageSquare size={24} />
              </div>
              <h3 className="font-bold text-lg text-gray-800">Community Interactions</h3>
              <p className="text-sm text-gray-500">Join direct message chats, vote on local polls, read circular announcements, and browse events.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900">How It Works</h2>
          <p className="mt-2 text-gray-500">Getting started with ApartmentHub takes only a few minutes.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-green-50 text-green-600 font-extrabold text-lg flex items-center justify-center rounded-full mb-4">1</div>
            <h4 className="font-bold text-gray-800 mb-2">Join Community</h4>
            <p className="text-xs text-gray-400">Select your local building block, tower, and unit number.</p>
          </div>
          <div className="text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-green-50 text-green-600 font-extrabold text-lg flex items-center justify-center rounded-full mb-4">2</div>
            <h4 className="font-bold text-gray-800 mb-2">Verify Account</h4>
            <p className="text-xs text-gray-400">Get your credentials verified by the local association manager.</p>
          </div>
          <div className="text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-green-50 text-green-600 font-extrabold text-lg flex items-center justify-center rounded-full mb-4">3</div>
            <h4 className="font-bold text-gray-800 mb-2">Manage Life</h4>
            <p className="text-xs text-gray-400">Handle guest invites, invoices, and service requests instantly.</p>
          </div>
          <div className="text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-green-50 text-green-600 font-extrabold text-lg flex items-center justify-center rounded-full mb-4">4</div>
            <h4 className="font-bold text-gray-800 mb-2">Stay Connected</h4>
            <p className="text-xs text-gray-400">Discuss with neighbors on chat and stay updated on announcements.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} ApartmentHub. Smart Living. Connected Community.</p>
          <div className="flex gap-4 text-xs">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

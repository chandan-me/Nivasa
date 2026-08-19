import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  CreditCard, ShieldAlert, Calendar, Bell, Wrench, 
  Plus, User, Shield, ArrowRight, MessageSquare 
} from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { maintenanceService } from '../services/maintenanceService';
import { visitorService } from '../services/visitorService';
import { interactionsService } from '../services/interactionsService';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const roles = user?.roles?.map(r => r.name) || [];

  // Redirect non-residents to their hubs
  useEffect(() => {
    if (roles.includes('SECURITY_GUARD')) {
      navigate('/guard');
    } else if (roles.includes('SERVICE_PROVIDER')) {
      navigate('/provider-portal');
    } else if (roles.includes('ASSOCIATION_ADMIN') || roles.includes('PLATFORM_ADMIN')) {
      navigate('/admin');
    }
  }, [roles, navigate]);

  const [paymentSummary, setPaymentSummary] = useState({ total_due: 0.0, upcoming_due_date: null });
  const [openTickets, setOpenTickets] = useState(0);
  const [expectedVisitors, setExpectedVisitors] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [paySum, tickets, visitors, anns, evts] = await Promise.all([
          paymentService.getSummary(),
          maintenanceService.getTickets('OPEN'),
          visitorService.getVisitors('', 'EXPECTED'),
          interactionsService.getAnnouncements(),
          interactionsService.getEvents()
        ]);
        
        setPaymentSummary(paySum);
        setOpenTickets(tickets.length);
        setExpectedVisitors(visitors.length);
        setAnnouncements(anns.slice(0, 3)); // Display top 3
        setEvents(evts.slice(0, 3)); // Display top 3
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (roles.includes('RESIDENT') || roles.includes('FAMILY_MEMBER')) {
      fetchDashboardData();
    }
  }, [roles]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-xs font-semibold text-gray-400">Syncing with community portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-2xl p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold">Welcome back, {user?.first_name}!</h2>
          <p className="mt-1 text-sm text-green-100">
            {user?.unit ? `Green Valley Apartments — Tower ${user.unit.building.name}, Unit ${user.unit.number}` : 'No community unit assigned yet.'}
          </p>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm text-xs font-bold uppercase tracking-wider">
          Verified Resident
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Outstanding Bills</span>
            <h3 className="text-2xl font-black text-gray-800">${paymentSummary.total_due.toFixed(2)}</h3>
            <p className="text-[10px] text-gray-400">Due: {paymentSummary.upcoming_due_date || 'No upcoming due'}</p>
          </div>
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Guest Passes</span>
            <h3 className="text-2xl font-black text-gray-800">{expectedVisitors}</h3>
            <p className="text-[10px] text-gray-400">Expected at gate today</p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-lg flex items-center justify-center">
            <Shield size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Open Ticket Inquiries</span>
            <h3 className="text-2xl font-black text-gray-800">{openTickets}</h3>
            <p className="text-[10px] text-gray-400">Assigned & In Progress</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center">
            <Wrench size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Scheduled Events</span>
            <h3 className="text-2xl font-black text-gray-800">{events.length}</h3>
            <p className="text-[10px] text-gray-400">RSVP-ready community events</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
            <Calendar size={24} />
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-base font-bold text-gray-800 mb-4">Quick Shortcuts</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link to="/visitors" className="p-4 rounded-lg bg-gray-50 hover:bg-green-50 hover:text-green-700 text-center flex flex-col items-center gap-2 border border-gray-100 transition-all font-semibold text-xs text-gray-600">
            <Plus size={20} />
            <span>Invite Guest</span>
          </Link>
          <Link to="/maintenance" className="p-4 rounded-lg bg-gray-50 hover:bg-green-50 hover:text-green-700 text-center flex flex-col items-center gap-2 border border-gray-100 transition-all font-semibold text-xs text-gray-600">
            <Wrench size={20} />
            <span>Raise Ticket</span>
          </Link>
          <Link to="/payments" className="p-4 rounded-lg bg-gray-50 hover:bg-green-50 hover:text-green-700 text-center flex flex-col items-center gap-2 border border-gray-100 transition-all font-semibold text-xs text-gray-600">
            <CreditCard size={20} />
            <span>Pay Invoices</span>
          </Link>
          <Link to="/local-services" className="p-4 rounded-lg bg-gray-50 hover:bg-green-50 hover:text-green-700 text-center flex flex-col items-center gap-2 border border-gray-100 transition-all font-semibold text-xs text-gray-600">
            <Users size={20} />
            <span>Hire Handyman</span>
          </Link>
          <Link to="/marketplace" className="p-4 rounded-lg bg-gray-50 hover:bg-green-50 hover:text-green-700 text-center flex flex-col items-center gap-2 border border-gray-100 transition-all font-semibold text-xs text-gray-600">
            <ShoppingBag size={20} />
            <span>Marketplace</span>
          </Link>
          <Link to="/chat" className="p-4 rounded-lg bg-gray-50 hover:bg-green-50 hover:text-green-700 text-center flex flex-col items-center gap-2 border border-gray-100 transition-all font-semibold text-xs text-gray-600">
            <MessageSquare size={20} />
            <span>Neighborhood Chat</span>
          </Link>
        </div>
      </div>

      {/* Announcements & Events Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Announcements */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-gray-800">Community Circulars</h3>
            <Link to="/interactions" className="text-xs text-green-600 hover:underline font-semibold flex items-center gap-1">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {announcements.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No announcements published.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {ann.is_pinned && <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Pinned</span>}
                    <span className="font-bold text-xs text-gray-700">{ann.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{ann.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-gray-800">Upcoming Gatherings</h3>
            <Link to="/interactions" className="text-xs text-green-600 hover:underline font-semibold flex items-center gap-1">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No community events scheduled.</p>
            ) : (
              events.map((evt) => (
                <div key={evt.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="font-bold text-xs text-gray-700 block">{evt.title}</span>
                    <span className="text-[10px] text-gray-400 block">{evt.location} | {new Date(evt.start_time).toLocaleString()}</span>
                  </div>
                  <Link to="/interactions" className="bg-green-50 hover:bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-lg font-bold">
                    RSVP
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

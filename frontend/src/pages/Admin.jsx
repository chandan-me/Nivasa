import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { supportService } from '../services/supportService';
import { 
  Users, CreditCard, ShieldAlert, Wrench, BarChart2, Check, X, ShieldAlert as ModIcon, 
  HelpCircle, Trash, Star, MessageSquare 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  
  // Dashboard states
  const [kpis, setKpis] = useState({
    total_residents: 0, total_units: 0, occupancy_rate: 0, 
    active_visitors: 0, open_maintenance: 0, collection_rate: 100,
    total_collected: 0, total_due: 0, service_requests: 0, marketplace_listings: 0
  });
  const [charts, setCharts] = useState({
    payment_collection: [], visitor_volume: [], maintenance_distribution: []
  });
  
  const [residents, setResidents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [reports, setReports] = useState([]);
  
  // Support ticket queue states
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
        const [kpiData, chartData] = await Promise.all([
          adminService.getDashboardKpis(),
          adminService.getAnalyticsCharts()
        ]);
        setKpis(kpiData);
        setCharts(chartData);
      } else if (activeTab === 'residents') {
        const resList = await adminService.getResidents();
        setResidents(resList);
      } else if (activeTab === 'vendors') {
        const vendList = await adminService.getVendors();
        setVendors(vendList);
      } else if (activeTab === 'reports') {
        const repList = await supportService.getReports();
        setReports(repList);
      } else if (activeTab === 'support') {
        const tickList = await supportService.getTickets();
        setTickets(tickList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const handleVerifyResident = async (userId) => {
    try {
      await adminService.verifyResident(userId);
      fetchAdminData();
    } catch (err) {
      alert('Failed to verify resident.');
    }
  };

  const handleDeactivateResident = async (userId) => {
    try {
      await adminService.deactivateResident(userId);
      fetchAdminData();
    } catch (err) {
      alert('Failed to deactivate resident.');
    }
  };

  const handleVerifyVendor = async (vendorId) => {
    try {
      await adminService.verifyVendor(vendorId);
      fetchAdminData();
    } catch (err) {
      alert('Failed to verify vendor.');
    }
  };

  const handleSuspendVendor = async (vendorId) => {
    try {
      await adminService.suspendVendor(vendorId);
      fetchAdminData();
    } catch (err) {
      alert('Failed to suspend vendor.');
    }
  };

  const handleResolveReport = async (reportId, actionStatus) => {
    try {
      await supportService.resolveReport(reportId, actionStatus, 'Moderated by Admin.');
      fetchAdminData();
    } catch (err) {
      alert('Failed to resolve report.');
    }
  };

  // Support ticket replies
  const loadTicketForReply = async (ticketId) => {
    try {
      const data = await supportService.getTicketDetails(ticketId);
      setSelectedTicket(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTicketReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    try {
      await supportService.sendTicketReply(selectedTicket.id, replyText);
      setReplyText('');
      loadTicketForReply(selectedTicket.id);
      fetchAdminData(); // Reload queue list
    } catch (err) {
      alert('Failed to send reply.');
    }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      await supportService.updateTicket(ticketId, { status: 'RESOLVED' });
      setSelectedTicket(null);
      fetchAdminData();
    } catch (err) {
      alert('Failed to resolve support ticket.');
    }
  };

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-800">Admin Control Center</h2>
        <p className="text-sm text-gray-400">Manage association permissions, view analytics, moderate listings, and resolve support queues.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 gap-6">
        {[
          { id: 'analytics', label: 'Analytics & KPIs', icon: <BarChart2 size={16} /> },
          { id: 'residents', label: 'Resident Approvals', icon: <Users size={16} /> },
          { id: 'vendors', label: 'Vendor Registry', icon: <Wrench size={16} /> },
          { id: 'reports', label: 'Mod Reports', icon: <ShieldAlert size={16} /> },
          { id: 'support', label: 'Support Queue', icon: <HelpCircle size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === tab.id 
                ? 'border-green-600 text-green-700 font-extrabold' 
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-xs text-gray-400">Loading database entries...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              {/* KPIs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Residents', value: kpis.total_residents, icon: <Users size={18} />, color: 'bg-green-50 text-green-600' },
                  { label: 'Occupancy', value: `${kpis.occupancy_rate.toFixed(0)}%`, icon: <CreditCard size={18} />, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Active Guests', value: kpis.active_visitors, icon: <ShieldAlert size={18} />, color: 'bg-purple-50 text-purple-600' },
                  { label: 'Open Repairs', value: kpis.open_maintenance, icon: <Wrench size={18} />, color: 'bg-amber-50 text-amber-600' },
                  { label: 'Collection Rate', value: `${kpis.collection_rate.toFixed(0)}%`, icon: <CreditCard size={18} />, color: 'bg-teal-50 text-teal-600' }
                ].map((k, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{k.label}</span>
                      <h4 className="text-lg font-black text-gray-800">{k.value}</h4>
                    </div>
                    <div className={`p-2 rounded-lg ${k.color}`}>{k.icon}</div>
                  </div>
                ))}
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visitor Volume chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-gray-800">Gate Visitor Volume (Last 7 Days)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.visitor_volume}>
                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} />
                        <YAxis stroke="#9CA3AF" fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="visitors" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Collection distribution */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-gray-800">Billing Collection Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.payment_collection}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {charts.payment_collection.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RESIDENTS TAB */}
          {activeTab === 'residents' && (
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4">Account Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                  {residents.map(r => (
                    <tr key={r.id}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{r.first_name} {r.last_name}</p>
                        <p className="text-[10px] text-gray-400">{r.email}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{r.phone || 'N/A'}</td>
                      <td className="px-6 py-4">
                        {r.is_verified ? (
                          <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold">Verified</span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold">Pending Approval</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {r.is_active ? (
                          <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold">Active</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded font-bold">Deactivated</span>
                        )}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        {!r.is_verified && (
                          <button 
                            onClick={() => handleVerifyResident(r.id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                          >
                            Verify Account
                          </button>
                        )}
                        {r.is_active && (
                          <button 
                            onClick={() => handleDeactivateResident(r.id)}
                            className="border border-red-200 hover:bg-red-50 text-red-700 font-bold px-3 py-1.5 rounded-lg text-xs"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VENDORS TAB */}
          {activeTab === 'vendors' && (
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4">Business Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4">Verify Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                  {vendors.map(v => (
                    <tr key={v.id}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{v.business_name}</p>
                        <p className="text-[10px] text-gray-400">Provider profile ID: {v.id.slice(0, 8)}...</p>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-bold text-[10px] uppercase">{v.category}</td>
                      <td className="px-6 py-4 flex items-center gap-1 text-amber-500 font-bold">
                        <Star size={14} className="fill-amber-500" />
                        <span>{v.rating.toFixed(1)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {v.status === 'VERIFIED' ? (
                          <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold">Verified</span>
                        ) : (
                          <span className="bg-yellow-50 text-yellow-700 text-[10px] px-2 py-0.5 rounded font-bold">{v.status}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {v.status !== 'VERIFIED' ? (
                          <button 
                            onClick={() => handleVerifyVendor(v.id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                          >
                            Verify Vendor
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleSuspendVendor(v.id)}
                            className="border border-red-200 hover:bg-red-50 text-red-700 font-bold px-3 py-1.5 rounded-lg text-xs"
                          >
                            Suspend Vendor
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MOD REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4">Report Reason</th>
                    <th className="px-6 py-4">Target Item Type</th>
                    <th className="px-6 py-4">Target Item ID</th>
                    <th className="px-6 py-4">Report Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                  {reports.map(rep => (
                    <tr key={rep.id}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{rep.reason}</p>
                        <p className="text-[10px] text-gray-400">{rep.details || 'No details provided.'}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-bold uppercase text-[10px]">{rep.reported_item_type}</td>
                      <td className="px-6 py-4 font-mono text-[10px] text-gray-400">{rep.reported_item_id.slice(0, 8)}...</td>
                      <td className="px-6 py-4">
                        {rep.status === 'PENDING' ? (
                          <span className="bg-yellow-50 text-yellow-700 text-[10px] px-2 py-0.5 rounded font-bold">Pending Review</span>
                        ) : (
                          <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold">{rep.status}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        {rep.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => handleResolveReport(rep.id, 'REJECTED')}
                              className="border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold px-3 py-1.5 rounded-lg text-xs"
                            >
                              Reject Report
                            </button>
                            <button 
                              onClick={() => handleResolveReport(rep.id, 'RESOLVED')}
                              className="bg-red-650 hover:bg-red-750 text-red-650 font-bold px-3 py-1.5 rounded-lg text-xs"
                            >
                              Resolve & Take Down
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SUPPORT TICKETS QUEUE */}
          {activeTab === 'support' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-bold text-base text-gray-800 border-b border-gray-50 pb-2">Support Tickets Queue</h3>
                {tickets.map(t => (
                  <div 
                    key={t.id}
                    onClick={() => loadTicketForReply(t.id)}
                    className={`p-6 bg-white border rounded-xl shadow-sm cursor-pointer hover:border-green-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      selectedTicket?.id === t.id ? 'border-green-500 ring-2 ring-green-50' : 'border-gray-100'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-100 text-gray-700 text-[9px] px-2 py-0.5 rounded font-bold uppercase">{t.status}</span>
                        <span className="text-xs text-gray-400 font-bold uppercase">Priority: {t.priority}</span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-800">{t.title}</h4>
                    </div>
                    <div className="text-[10px] text-gray-400 font-semibold">{new Date(t.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>

              {/* Reply box panel */}
              <div className="bg-white p-6 border border-gray-100 shadow-sm rounded-xl h-[450px] flex flex-col justify-between">
                {selectedTicket ? (
                  <>
                    <div className="border-b border-gray-50 pb-3 flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-800 truncate max-w-[180px]">{selectedTicket.title}</h4>
                        <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">Owner: {selectedTicket.user_id.slice(0, 8)}...</p>
                      </div>
                      {selectedTicket.status !== 'RESOLVED' && (
                        <button 
                          onClick={() => handleResolveTicket(selectedTicket.id)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold px-2 py-1 rounded text-[10px] shadow-sm"
                        >
                          Resolve
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
                      {selectedTicket.messages.map(m => (
                        <div key={m.id} className={`flex flex-col ${m.sender_id !== selectedTicket.user_id ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                            m.sender_id !== selectedTicket.user_id ? 'bg-green-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-850 rounded-tl-none'
                          }`}>
                            {m.message}
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedTicket.status !== 'RESOLVED' && (
                      <form onSubmit={handleTicketReplySubmit} className="flex gap-2 border-t border-gray-50 pt-3">
                        <input 
                          type="text" required value={replyText} onChange={(e) => setReplyText(e.target.value)} 
                          placeholder="Type admin reply..."
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none" 
                        />
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 rounded-lg text-xs">Send</button>
                      </form>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 text-gray-400 text-xs font-semibold my-auto">
                    Select a support ticket to reply.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Admin;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { maintenanceService } from '../services/maintenanceService';
import { Plus, AlertCircle, Wrench, ShieldAlert } from 'lucide-react';

const Maintenance = () => {
  const { user } = useAuth();
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Create ticket state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('PLUMBING');
  const [priority, setPriority] = useState('MEDIUM');
  
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchTickets = async () => {
    try {
      const data = await maintenanceService.getTickets();
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    const payload = {
      title,
      description,
      category,
      priority
    };

    try {
      await maintenanceService.raiseTicket(payload);
      setShowModal(false);
      setTitle('');
      setDescription('');
      setCategory('PLUMBING');
      setPriority('MEDIUM');
      fetchTickets();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit maintenance inquiry.');
    } finally {
      setFormLoading(false);
    }
  };

  const approveResolution = async (ticketId, isApprove) => {
    try {
      await maintenanceService.updateTicket(ticketId, {
        status: isApprove ? 'CLOSED' : 'REOPENED',
        notes: isApprove ? 'Resident approved the resolution.' : 'Resident rejected resolution and reopened ticket.'
      });
      fetchTickets();
      setSelectedTicket(null);
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'EMERGENCY':
        return <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Emergency</span>;
      case 'HIGH':
        return <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">High</span>;
      case 'MEDIUM':
        return <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Medium</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{prio}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span className="bg-red-50 text-red-700 text-[10px] px-2 py-0.5 rounded font-bold">Open</span>;
      case 'ASSIGNED':
        return <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold">Assigned</span>;
      case 'IN_PROGRESS':
        return <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold">In Progress</span>;
      case 'RESOLVED':
        return <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold">Resolved</span>;
      case 'CLOSED':
        return <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded font-bold">Closed</span>;
      default:
        return <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Maintenance & Complaints</h2>
          <p className="text-sm text-gray-400">Raise utility complaints and monitor the ticket repair timelines.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> Raise Complaint
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-xs text-gray-400">Loading complaints register...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
          <Wrench className="text-gray-300 mx-auto" size={48} />
          <h3 className="font-bold text-gray-700">No Tickets Filed</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">Everything is working fine! File a maintenance ticket if you experience electrical, plumbing, or cleaning issues in your unit.</p>
          <button onClick={() => setShowModal(true)} className="text-xs text-green-600 font-bold hover:underline">File ticket now</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Tickets List */}
          <div className="lg:col-span-2 space-y-4">
            {tickets.map((t) => (
              <div 
                key={t.id} 
                onClick={() => setSelectedTicket(t)}
                className={`p-6 bg-white border rounded-xl shadow-sm cursor-pointer hover:border-green-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  selectedTicket?.id === t.id ? 'border-green-500 ring-2 ring-green-50' : 'border-gray-100'
                }`}
              >
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(t.status)}
                    {getPriorityBadge(t.priority)}
                    <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">{t.category}</span>
                  </div>
                  <h4 className="font-bold text-sm text-gray-800">{t.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-1">{t.description}</p>
                </div>
                <div className="text-right text-[10px] text-gray-400 font-semibold self-end sm:self-center shrink-0">
                  {new Date(t.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* Ticket Details Panel */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6 text-left">
            {selectedTicket ? (
              <div className="space-y-6">
                <div className="border-b border-gray-50 pb-4">
                  <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">{selectedTicket.category}</span>
                  <h3 className="font-extrabold text-base text-gray-800 mt-1">{selectedTicket.title}</h3>
                  <div className="flex gap-2 mt-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-400 uppercase">Complaint details</span>
                  <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg leading-relaxed">{selectedTicket.description}</p>
                </div>

                {selectedTicket.sla_deadline && (
                  <div className="text-xs border border-gray-100 p-3 rounded-lg flex items-center justify-between font-semibold">
                    <span className="text-gray-400">SLA Resolution Target</span>
                    <span className="text-gray-700">{new Date(selectedTicket.sla_deadline).toLocaleString()}</span>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-gray-400 uppercase">Audit Timeline Log</span>
                  <div className="relative border-l border-gray-100 pl-4 ml-2 space-y-4">
                    {selectedTicket.timeline.map((event) => (
                      <div key={event.id} className="relative text-xs">
                        {/* Dot indicator */}
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-green-500 border border-white"></div>
                        <p className="font-bold text-gray-700">{event.status}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{event.notes}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">{new Date(event.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions for resolved tickets */}
                {selectedTicket.status === 'RESOLVED' && (
                  <div className="flex gap-4 border-t border-gray-50 pt-4">
                    <button 
                      onClick={() => approveResolution(selectedTicket.id, false)}
                      className="flex-1 py-2 border border-red-200 text-red-700 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Reject & Reopen
                    </button>
                    <button 
                      onClick={() => approveResolution(selectedTicket.id, true)}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Approve & Close
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs font-semibold">
                Select a ticket from the left panel to review timeline logs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Raise Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">File Maintenance Complaint</h3>
              <p className="text-xs text-gray-400">Describe the repair inquiry for our technical desk.</p>
            </div>

            {error && <div className="bg-red-50 text-red-800 text-xs px-3 py-2 rounded-lg font-semibold">{error}</div>}

            <form onSubmit={handleCreateTicket} className="space-y-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Complaint Summary</label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Kitchen faucet leaking / corridor light bulb out"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Detailed Description</label>
                <textarea 
                  required rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about the issue location, leakage, or sparks..."
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Category</label>
                  <select 
                    value={category} onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="LIFT">Lift</option>
                    <option value="SECURITY">Security</option>
                    <option value="WATER">Water</option>
                    <option value="COMMON_AREA">Common Area</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Priority</label>
                  <select 
                    value={priority} onChange={(e) => setPriority(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:bg-green-400">
                  {formLoading ? 'Submitting...' : 'File Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;

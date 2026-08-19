import React, { useState, useEffect } from 'react';
import { supportService } from '../services/supportService';
import { Plus, Info, MessageSquare, AlertCircle } from 'lucide-react';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Create ticket form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  
  const [replyMessage, setReplyMessage] = useState('');
  
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchTickets = async () => {
    try {
      const data = await supportService.getTickets();
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

    try {
      await supportService.createTicket({ title, description, priority });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      fetchTickets();
    } catch (err) {
      setError('Failed to submit support ticket.');
    } finally {
      setFormLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId) => {
    try {
      const data = await supportService.getTicketDetails(ticketId);
      setSelectedTicket(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      await supportService.sendTicketReply(selectedTicket.id, replyMessage);
      setReplyMessage('');
      loadTicketDetails(selectedTicket.id); // Reload message thread
    } catch (err) {
      alert('Failed to send reply.');
    }
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
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
      case 'RESOLVED':
        return <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold">Resolved</span>;
      case 'CLOSED':
        return <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded font-bold">Closed</span>;
      default:
        return <span className="bg-gray-50 text-gray-650 text-[10px] px-2 py-0.5 rounded font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Help & Support Desk</h2>
          <p className="text-sm text-gray-400">File general inquiries, administrative tickets, or dispute resolutions.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-xs text-gray-400">Loading support register...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
          <Info className="text-gray-300 mx-auto" size={48} />
          <h3 className="font-bold text-gray-700">No Support Tickets Raised</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">If you experience administrative disputes, payments issue, or rule violations, submit a ticket to the association desk.</p>
          <button onClick={() => setShowModal(true)} className="text-xs text-green-600 font-bold hover:underline">Raise support ticket now</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Tickets List */}
          <div className="lg:col-span-2 space-y-4">
            {tickets.map(t => (
              <div 
                key={t.id}
                onClick={() => loadTicketDetails(t.id)}
                className={`p-6 bg-white border rounded-xl shadow-sm cursor-pointer hover:border-green-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  selectedTicket?.id === t.id ? 'border-green-500 ring-2 ring-green-50' : 'border-gray-100'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(t.status)}
                    {getPriorityBadge(t.priority)}
                  </div>
                  <h4 className="font-bold text-sm text-gray-800">{t.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-1">{t.description}</p>
                </div>
                <div className="text-right text-[10px] text-gray-400 font-semibold shrink-0">
                  {new Date(t.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* Ticket Messages History */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6 flex flex-col justify-between h-[500px]">
            {selectedTicket ? (
              <>
                <div className="border-b border-gray-50 pb-3 flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-800">{selectedTicket.title}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">Status: {selectedTicket.status}</p>
                  </div>
                  {getStatusBadge(selectedTicket.status)}
                </div>

                {/* Message logs */}
                <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
                  {selectedTicket.messages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                        m.sender_id === user.id ? 'bg-green-600 text-white rounded-tr-none' : 'bg-gray-150 text-gray-850 rounded-tl-none'
                      }`}>
                        {m.message}
                      </div>
                      <span className="text-[8px] text-gray-400 mt-1">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                {selectedTicket.status !== 'CLOSED' && (
                  <form onSubmit={handleSendReply} className="flex gap-2 border-t border-gray-50 pt-3">
                    <input 
                      type="text" 
                      required 
                      value={replyMessage} 
                      onChange={(e) => setReplyMessage(e.target.value)} 
                      placeholder="Type reply..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                    />
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 rounded-lg text-xs">
                      Send
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="text-center py-20 text-gray-400 text-xs font-semibold my-auto">
                Select a ticket from the left panel to review ticket conversation and message logs.
              </div>
            )}
          </div>

        </div>
      )}

      {/* New Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Raise Support Ticket</h3>
              <p className="text-xs text-gray-400">Describe the issue for our admin review desk.</p>
            </div>

            {error && <div className="bg-red-50 text-red-800 text-xs px-3 py-2 rounded-lg font-semibold">{error}</div>}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Ticket Title</label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Disputed August maintenance bill / parking slot issue"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Issue Description</label>
                <textarea 
                  required rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your inquiry or grievance in details..."
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                />
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
                </select>
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

export default Support;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { visitorService } from '../services/visitorService';
import { Plus, ShieldAlert } from 'lucide-react';

const Visitors = () => {
  const { user } = useAuth();
  
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState('');
  
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchVisitors = async () => {
    try {
      const data = await visitorService.getVisitors();
      setVisitors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleCreatePass = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    const payload = {
      name,
      phone,
      purpose,
      date,
      start_time: startTime || null,
      end_time: endTime || null,
      vehicle_details: vehicleDetails || null,
      unit_id: user.unit_id
    };

    try {
      await visitorService.createVisitor(payload);
      setShowModal(false);
      // Reset form
      setName('');
      setPhone('');
      setPurpose('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setVehicleDetails('');
      fetchVisitors();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create visitor pass. Please verify details.');
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'EXPECTED':
        return <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">Expected</span>;
      case 'ENTERED':
        return <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">Entered</span>;
      case 'EXITED':
        return <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">Exited</span>;
      case 'REJECTED':
        return <span className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">Rejected</span>;
      default:
        return <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Visitor Gate Passes</h2>
          <p className="text-sm text-gray-400">Generate guest authorization vouchers and review active gate logs.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> New Pass
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-xs text-gray-400">Fetching invitations...</p>
        </div>
      ) : visitors.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
          <ShieldAlert className="text-gray-300 mx-auto" size={48} />
          <h3 className="font-bold text-gray-700">No Visitor Passes Generated</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">Generate visitor passes in advance so security guards at the gate can check and verify their entry easily.</p>
          <button onClick={() => setShowModal(true)} className="text-xs text-green-600 font-bold hover:underline">Create a pass now</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Visitor Name</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4">Date & Timing</th>
                <th className="px-6 py-4">Vehicle Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Gate Checktimes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
              {visitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{visitor.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{visitor.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{visitor.purpose || 'Personal'}</td>
                  <td className="px-6 py-4">
                    <p>{new Date(visitor.date).toLocaleDateString()}</p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {visitor.start_time ? `${visitor.start_time} - ${visitor.end_time || 'No end time'}` : 'All Day'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{visitor.vehicle_details || 'No vehicle'}</td>
                  <td className="px-6 py-4">{getStatusBadge(visitor.status)}</td>
                  <td className="px-6 py-4 font-medium text-gray-400 text-[10px]">
                    <p>In: {visitor.entry_time ? new Date(visitor.entry_time).toLocaleTimeString() : 'N/A'}</p>
                    <p>Out: {visitor.exit_time ? new Date(visitor.exit_time).toLocaleTimeString() : 'N/A'}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Pass Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-lg w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Generate Visitor Pass</h3>
              <p className="text-xs text-gray-400">Fill in guest details to clear their gate entry in advance.</p>
            </div>

            {error && <div className="bg-red-50 text-red-800 text-xs px-3 py-2 rounded-lg font-semibold">{error}</div>}

            <form onSubmit={handleCreatePass} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Guest Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Phone Number</label>
                  <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Visit Purpose</label>
                <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Delivery, Friend, Housekeeping" className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Visit Date</label>
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Start Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Vehicle Plate details</label>
                <input type="text" value={vehicleDetails} onChange={(e) => setVehicleDetails(e.target.value)} placeholder="e.g. Yamaha R15 / Toyota Civic (Plate details)" className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" />
              </div>

              <div className="flex gap-4 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:bg-green-400">
                  {formLoading ? 'Submitting...' : 'Issue Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visitors;

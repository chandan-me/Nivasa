import React, { useState, useEffect } from 'react';
import { serviceService } from '../services/serviceService';
import { Wrench, CheckCircle, Clock, Play, User, Check, Star } from 'lucide-react';

const ProviderPortal = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProviderRequests = async () => {
    try {
      const data = await serviceService.getRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderRequests();
  }, []);

  const updateRequestStatus = async (reqId, status) => {
    try {
      await serviceService.updateRequest(reqId, { status });
      fetchProviderRequests();
    } catch (err) {
      alert('Failed to update request.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="bg-blue-50 text-blue-700 text-[10px] px-2.5 py-0.5 rounded font-bold">New Request</span>;
      case 'ACCEPTED':
        return <span className="bg-yellow-50 text-yellow-700 text-[10px] px-2.5 py-0.5 rounded font-bold">Accepted</span>;
      case 'SCHEDULED':
        return <span className="bg-purple-50 text-purple-700 text-[10px] px-2.5 py-0.5 rounded font-bold">Scheduled</span>;
      case 'IN_PROGRESS':
        return <span className="bg-amber-50 text-amber-700 text-[10px] px-2.5 py-0.5 rounded font-bold">In Progress</span>;
      case 'COMPLETED':
        return <span className="bg-green-50 text-green-700 text-[10px] px-2.5 py-0.5 rounded font-bold">Completed</span>;
      case 'CANCELLED':
        return <span className="bg-red-50 text-red-700 text-[10px] px-2.5 py-0.5 rounded font-bold">Cancelled</span>;
      default:
        return <span className="bg-gray-50 text-gray-500 text-[10px] px-2.5 py-0.5 rounded font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl p-6 shadow-sm flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Wrench className="text-green-500" size={24} /> Provider Jobs Portal
          </h2>
          <p className="text-xs text-gray-400">Manage community booking requests, review client ratings, and track job timelines.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-xs text-gray-400">Loading service logs...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm text-gray-400 text-xs font-semibold">
          No service requests assigned to your business account.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map(req => (
            <div key={req.id} className="bg-white p-6 border border-gray-100 rounded-xl shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-semibold">{new Date(req.scheduled_time).toLocaleString()}</span>
                  {getStatusBadge(req.status)}
                </div>
                
                <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg leading-relaxed">{req.description}</p>
                
                <div className="text-[10px] text-gray-400 font-bold uppercase space-y-0.5 border-t border-gray-50 pt-2">
                  <p>Customer ID: <span className="text-gray-700">{req.resident_id.slice(0, 8)}...</span></p>
                  <p>Unit Location: <span className="text-gray-700">Tower Block (Unit ID: {req.unit_id.slice(0, 8)})</span></p>
                </div>

                {req.rating && (
                  <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-lg space-y-1 text-xs">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} className="fill-amber-500" />
                      <span className="font-bold">{req.rating} / 5</span>
                    </div>
                    {req.review && <p className="text-gray-600 italic">"{req.review}"</p>}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {req.status === 'REQUESTED' && (
                  <>
                    <button 
                      onClick={() => updateRequestStatus(req.id, 'CANCELLED')}
                      className="flex-1 py-2 border border-red-200 text-red-700 text-xs font-bold rounded-lg hover:bg-red-50"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={() => updateRequestStatus(req.id, 'ACCEPTED')}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Accept Job
                    </button>
                  </>
                )}

                {req.status === 'ACCEPTED' && (
                  <button 
                    onClick={() => updateRequestStatus(req.id, 'SCHEDULED')}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    Confirm Schedule
                  </button>
                )}

                {req.status === 'SCHEDULED' && (
                  <button 
                    onClick={() => updateRequestStatus(req.id, 'IN_PROGRESS')}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    Start Work
                  </button>
                )}

                {req.status === 'IN_PROGRESS' && (
                  <button 
                    onClick={() => updateRequestStatus(req.id, 'COMPLETED')}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    Mark Job Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderPortal;

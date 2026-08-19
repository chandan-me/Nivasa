import React, { useState, useEffect } from 'react';
import { visitorService } from '../services/visitorService';
import { deliveryService } from '../services/deliveryService';
import { ShieldCheck, Plus, Check, LogOut, Package, UserCheck, AlertTriangle } from 'lucide-react';

const GuardPortal = () => {
  const [expectedVisitors, setExpectedVisitors] = useState([]);
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Delivery Form
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [company, setCompany] = useState('Amazon');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [residentEmail, setResidentEmail] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [delivLoading, setDelivLoading] = useState(false);

  const fetchGuardData = async () => {
    try {
      const [expList, actList, delList] = await Promise.all([
        visitorService.getVisitors('', 'EXPECTED'),
        visitorService.getVisitors('', 'ENTERED'),
        deliveryService.getDeliveries('ARRIVED')
      ]);
      setExpectedVisitors(expList);
      setActiveVisitors(actList);
      setDeliveries(delList);
    } catch (err) {
      console.error('Failed to load gate logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardData();
  }, []);

  const handleVisitorCheckin = async (visitorId, isAccept) => {
    try {
      await visitorService.updateVisitorStatus(visitorId, isAccept ? 'ENTERED' : 'REJECTED');
      fetchGuardData();
    } catch (err) {
      alert('Failed to update visitor status.');
    }
  };

  const handleVisitorCheckout = async (visitorId) => {
    try {
      await visitorService.updateVisitorStatus(visitorId, 'EXITED');
      fetchGuardData();
    } catch (err) {
      alert('Failed to register exit check.');
    }
  };

  const handleLogDelivery = async (e) => {
    e.preventDefault();
    setDelivLoading(true);
    try {
      await deliveryService.recordDelivery({
        company,
        tracking_number: trackingNumber,
        resident_email: residentEmail,
        unit_number: unitNumber
      });
      setShowDeliveryModal(false);
      setTrackingNumber('');
      setResidentEmail('');
      setUnitNumber('');
      fetchGuardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to log package delivery. Ensure resident details match.');
    } finally {
      setDelivLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-left">
      <div className="flex justify-between items-center bg-gray-900 text-white p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <ShieldCheck className="text-green-500" size={28} /> Gate Operations Control
          </h2>
          <p className="text-xs text-gray-400">Green Valley Security Portal — Guard Checkpoint</p>
        </div>
        <button 
          onClick={() => setShowDeliveryModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Package size={16} /> Log Courier Delivery
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-xs text-gray-400">Syncing gate dashboard...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* EXPECTED VISITORS */}
          <div className="bg-white p-6 border border-gray-100 shadow-sm rounded-xl space-y-4">
            <h3 className="font-extrabold text-sm text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-2">
              <UserCheck size={18} className="text-blue-500" /> Expected Check-ins Today ({expectedVisitors.length})
            </h3>
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto pr-1">
              {expectedVisitors.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-12">No expected guests scheduled today.</p>
              ) : (
                expectedVisitors.map(v => (
                  <div key={v.id} className="py-4 flex justify-between items-center gap-4">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-gray-800">{v.name}</h4>
                      <p className="text-[10px] text-gray-400 font-semibold">Phone: {v.phone} | Purpose: {v.purpose || 'Personal'}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Visiting Resident (A-101)</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleVisitorCheckin(v.id, false)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold border border-red-100"
                      >
                        Decline
                      </button>
                      <button 
                        onClick={() => handleVisitorCheckin(v.id, true)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold p-1.5 rounded-lg text-xs shadow-sm flex items-center gap-1"
                      >
                        <Check size={14} /> Approve Check-in
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ACTIVE VISITORS (ENTERED) */}
          <div className="bg-white p-6 border border-gray-100 shadow-sm rounded-xl space-y-4">
            <h3 className="font-extrabold text-sm text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-2">
              <ShieldCheck size={18} className="text-green-500" /> Currently In Community ({activeVisitors.length})
            </h3>
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto pr-1">
              {activeVisitors.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-12">No visitors inside the community.</p>
              ) : (
                activeVisitors.map(v => (
                  <div key={v.id} className="py-4 flex justify-between items-center gap-4">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-gray-800">{v.name}</h4>
                      <p className="text-[10px] text-gray-400 font-semibold">Entered: {new Date(v.entry_time).toLocaleTimeString()}</p>
                    </div>
                    <button 
                      onClick={() => handleVisitorCheckout(v.id)}
                      className="bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-600 font-bold p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
                    >
                      <LogOut size={14} /> Record Exit
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* Courier Delivery Log Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Log Package Arrival</h3>
              <p className="text-xs text-gray-400">Record arrived deliveries to trigger resident notifications.</p>
            </div>

            <form onSubmit={handleLogDelivery} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Courier Company</label>
                  <select 
                    value={company} onChange={(e) => setCompany(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    <option value="Amazon">Amazon</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL</option>
                    <option value="UPS">UPS</option>
                    <option value="Local Courier">Local Courier</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Tracking Number</label>
                  <input 
                    type="text" required value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} 
                    placeholder="e.g. TRK9988"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Resident Account Email</label>
                <input 
                  type="email" required value={residentEmail} onChange={(e) => setResidentEmail(e.target.value)} 
                  placeholder="e.g. residenta@apartmenthub.com"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none" 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Unit Number</label>
                <input 
                  type="text" required value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} 
                  placeholder="e.g. A-101"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none" 
                />
              </div>

              <div className="flex gap-4 justify-end pt-2">
                <button type="button" onClick={() => setShowDeliveryModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={delivLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:bg-green-400">
                  {delivLoading ? 'Logging...' : 'Log Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardPortal;

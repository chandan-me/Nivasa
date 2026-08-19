import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { parkingService } from '../services/parkingService';
import { Car, Plus, Trash2, AlertOctagon } from 'lucide-react';

const Parking = () => {
  const { user } = useAuth();
  
  const [vehicles, setVehicles] = useState([]);
  const [slots, setSlots] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [regNum, setRegNum] = useState('');
  const [vehType, setVehType] = useState('CAR');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [vehLoading, setVehLoading] = useState(false);

  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationSlotId, setViolationSlotId] = useState('');
  const [violationDesc, setViolationDesc] = useState('');
  const [violLoading, setViolLoading] = useState(false);

  const fetchParkingData = async () => {
    try {
      const [vehList, slotList, violList] = await Promise.all([
        parkingService.getVehicles(),
        parkingService.getSlots(),
        parkingService.getViolations()
      ]);
      setVehicles(vehList);
      setSlots(slotList);
      setViolations(violList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingData();
  }, []);

  const handleRegisterVehicle = async (e) => {
    e.preventDefault();
    setVehLoading(true);
    try {
      await parkingService.registerVehicle({
        registration_number: regNum,
        vehicle_type: vehType,
        model,
        color
      });
      setShowVehicleModal(false);
      setRegNum('');
      setModel('');
      setColor('');
      fetchParkingData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to register vehicle.');
    } finally {
      setVehLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehId) => {
    if (confirm('Are you sure you want to remove this vehicle registration?')) {
      try {
        await parkingService.deleteVehicle(vehId);
        fetchParkingData();
      } catch (err) {
        alert('Failed to remove vehicle.');
      }
    }
  };

  const handleReportViolation = async (e) => {
    e.preventDefault();
    setViolLoading(true);
    try {
      await parkingService.reportViolation({
        slot_id: violationSlotId || null,
        description: violationDesc
      });
      setShowViolationModal(false);
      setViolationSlotId('');
      setViolationDesc('');
      fetchParkingData();
    } catch (err) {
      alert('Failed to submit violation report.');
    } finally {
      setViolLoading(false);
    }
  };

  // Resolve user slot from slot list
  const userSlots = slots.filter(s => s.assigned_user_id === user.id);

  return (
    <div className="space-y-8 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Parking & Vehicle Center</h2>
          <p className="text-sm text-gray-400">Register your vehicles, check assigned slots, and report parking violations.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowViolationModal(true)}
            className="border border-red-200 hover:bg-red-50 text-red-700 text-sm font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2"
          >
            <AlertOctagon size={16} /> Report Violation
          </button>
          <button 
            onClick={() => setShowVehicleModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2"
          >
            <Plus size={16} /> Add Vehicle
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-xs text-gray-400">Synchronizing parking registry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left panel: Vehicles list & Slots */}
          <div className="lg:col-span-2 space-y-6">
            {/* Slot details */}
            <div className="bg-white p-6 border border-gray-100 shadow-sm rounded-xl space-y-4">
              <h3 className="font-bold text-base text-gray-800">Your Assigned Parking Slots</h3>
              {userSlots.length === 0 ? (
                <div className="text-xs text-gray-400 py-4 font-semibold">No permanent parking slot assigned yet. Please contact the property administrator.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userSlots.map(slot => (
                    <div key={slot.id} className="p-4 bg-green-50/50 border border-green-100 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Slot Allocation</span>
                        <h4 className="text-xl font-black text-green-800 mt-1">{slot.slot_number}</h4>
                        <p className="text-[10px] text-gray-400 mt-1">Status: {slot.status}</p>
                      </div>
                      <Car size={32} className="text-green-600 opacity-80" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicles List */}
            <div className="bg-white p-6 border border-gray-100 shadow-sm rounded-xl space-y-4">
              <h3 className="font-bold text-base text-gray-800">Your Registered Vehicles</h3>
              {vehicles.length === 0 ? (
                <div className="text-xs text-gray-400 py-8 text-center font-semibold">No vehicles registered. Add a vehicle so gate security can verify it.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vehicles.map(v => (
                    <div key={v.id} className="p-4 border border-gray-150 rounded-lg flex justify-between items-center hover:border-green-200 transition-colors">
                      <div className="space-y-1">
                        <span className="bg-gray-100 text-gray-700 text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">{v.vehicle_type}</span>
                        <h4 className="text-sm font-black text-gray-800 mt-1">{v.registration_number}</h4>
                        <p className="text-xs text-gray-500 font-medium">{v.color} {v.model}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteVehicle(v.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Violations List */}
          <div className="bg-white p-6 border border-gray-100 shadow-sm rounded-xl space-y-4">
            <h3 className="font-bold text-base text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
              <AlertOctagon size={18} className="text-red-500" /> Filed Violations
            </h3>
            <div className="space-y-4">
              {violations.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-12">No violations reported.</p>
              ) : (
                violations.map(viol => (
                  <div key={viol.id} className="p-4 bg-gray-50 border border-gray-100 rounded-lg flex flex-col gap-1.5">
                    <span className="text-[9px] text-gray-400 font-semibold">{new Date(viol.created_at).toLocaleString()}</span>
                    <p className="text-xs text-gray-600 font-semibold leading-normal">{viol.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* Register Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Register Vehicle</h3>
              <p className="text-xs text-gray-400">Fill in license details for automatic gate access verification.</p>
            </div>

            <form onSubmit={handleRegisterVehicle} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Registration Number</label>
                <input 
                  type="text" required value={regNum} onChange={(e) => setRegNum(e.target.value)} 
                  placeholder="e.g. MH-12-AB-1234"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Vehicle Type</label>
                  <select 
                    value={vehType} onChange={(e) => setVehType(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    <option value="CAR">Car / SUV</option>
                    <option value="MOTORCYCLE">Two Wheeler</option>
                    <option value="BICYCLE">Bicycle</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Color</label>
                  <input 
                    type="text" required value={color} onChange={(e) => setColor(e.target.value)} 
                    placeholder="e.g. Silver / Black"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Vehicle Model</label>
                <input 
                  type="text" required value={model} onChange={(e) => setModel(e.target.value)} 
                  placeholder="e.g. Honda City / Pulsar 150"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none" 
                />
              </div>

              <div className="flex gap-4 justify-end pt-2">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={vehLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:bg-green-400">
                  {vehLoading ? 'Registering...' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Violation Modal */}
      {showViolationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Report Parking Violation</h3>
              <p className="text-xs text-gray-400">Report unauthorized cars parked in your slot to security guards.</p>
            </div>

            <form onSubmit={handleReportViolation} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Affected Slot</label>
                <select 
                  value={violationSlotId} onChange={(e) => setViolationSlotId(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                >
                  <option value="">Select Slot</option>
                  {userSlots.map(s => <option key={s.id} value={s.id}>{s.slot_number}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Violation Details (Car color, plate number)</label>
                <textarea 
                  required rows={3} value={violationDesc} onChange={(e) => setViolationDesc(e.target.value)}
                  placeholder="e.g. Unidentified black SUV plate MH-12-XX-9999 parked in my assigned slot P-A01 since 3 PM."
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                />
              </div>

              <div className="flex gap-4 justify-end pt-2">
                <button type="button" onClick={() => setShowViolationModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={violLoading} className="px-4 py-2 bg-red-650 hover:bg-red-750 text-red-650 rounded-lg text-xs font-bold shadow-sm disabled:bg-red-400">
                  {violLoading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parking;

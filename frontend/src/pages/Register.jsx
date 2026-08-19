import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { communityService } from '../services/communityService';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState('RESIDENT');
  
  // Dynamic selections
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const data = await communityService.getCommunities();
        setCommunities(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCommunities();
  }, []);

  useEffect(() => {
    const fetchBuildings = async () => {
      if (selectedCommunity) {
        try {
          const data = await communityService.getBuildings(selectedCommunity);
          setBuildings(data);
          setUnits([]);
        } catch (err) {
          console.error(err);
        }
      } else {
        setBuildings([]);
        setUnits([]);
      }
    };
    fetchBuildings();
  }, [selectedCommunity]);

  useEffect(() => {
    const fetchUnits = async () => {
      if (selectedBuilding) {
        try {
          const data = await communityService.getUnits(selectedBuilding);
          setUnits(data);
        } catch (err) {
          console.error(err);
        }
      } else {
        setUnits([]);
      }
    };
    fetchUnits();
  }, [selectedBuilding]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const payload = {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone,
      role_name: roleName,
      unit_id: selectedUnit || null
    };

    try {
      await register(payload);
      setSuccess('Registration successful! Please wait for admin approval before logging in.');
      setTimeout(() => navigate('/login'), 3500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Registration failed. Check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <div className="max-w-lg w-full bg-white p-8 rounded-xl shadow-md border border-gray-100 flex flex-col gap-6">
        <div className="text-center">
          <Link to="/" className="text-3xl font-black text-green-600 tracking-tight">ApartmentHub</Link>
          <h2 className="text-xl font-bold text-gray-800 mt-4">Create Account</h2>
          <p className="text-sm text-gray-400 mt-1">Join your community today.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-2.5 rounded-lg font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-xs px-4 py-2.5 rounded-lg font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
              <input 
                type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
              <input 
                type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
              <input 
                type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Account Type</label>
              <select 
                value={roleName} onChange={(e) => setRoleName(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
              >
                <option value="RESIDENT">Resident</option>
                <option value="SECURITY_GUARD">Security Guard</option>
                <option value="SERVICE_PROVIDER">Service Provider</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Conditional community selector for residents */}
          {roleName === 'RESIDENT' && (
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-3 border border-gray-100">
              <span className="text-xs font-bold text-gray-700 uppercase">Apartment Information</span>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Community</label>
                <select 
                  value={selectedCommunity} onChange={(e) => setSelectedCommunity(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                >
                  <option value="">Select Community</option>
                  {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Building / Tower</label>
                  <select 
                    value={selectedBuilding} onChange={(e) => setSelectedBuilding(e.target.value)}
                    disabled={!selectedCommunity}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none disabled:bg-gray-100"
                  >
                    <option value="">Select Building</option>
                    {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Unit Number</label>
                  <select 
                    value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}
                    disabled={!selectedBuilding}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none disabled:bg-gray-100"
                  >
                    <option value="">Select Unit</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.number} (Floor {u.floor})</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition-all shadow-sm flex items-center justify-center disabled:bg-green-400"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 font-semibold">
          Already have an account? <Link to="/login" className="text-green-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

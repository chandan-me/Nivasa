import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { communityService } from '../services/communityService';
import { Search, UserCheck, Phone, Mail } from 'lucide-react';

const Directory = () => {
  const { user } = useAuth();
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDirectory = async () => {
    if (user?.unit?.building?.community_id) {
      try {
        const data = await communityService.getDirectory(
          user.unit.building.community_id,
          searchTerm
        );
        setMembers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, [searchTerm, user]);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-800">Community Directory</h2>
        <p className="text-sm text-gray-400">Discover and contact other verified residents in your residential blocks.</p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md w-full">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search neighbors by name, block, unit..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500 shadow-sm"
        />
        <Search className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-xs text-gray-400">Loading directory index...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 text-center text-gray-400 text-xs font-semibold shadow-sm">
          No residents found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map(member => (
            <div key={member.id} className="bg-white p-6 border border-gray-100 shadow-sm rounded-xl flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-gray-800">{member.first_name} {member.last_name}</h4>
                  <span className="bg-green-50 text-green-700 text-[9px] px-2 py-0.5 rounded font-bold uppercase">{member.role_name}</span>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Tower {member.building_name} | Unit {member.unit_number}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-gray-50 text-xs font-medium text-gray-500">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  <span>{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Directory;

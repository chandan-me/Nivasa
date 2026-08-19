import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { serviceService } from '../services/serviceService';
import { Wrench, CheckCircle, Clock, Star, StarOff, Users } from 'lucide-react';

const LocalServices = () => {
  const { user } = useAuth();
  
  const [providers, setProviders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Booking modal
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [bookingTime, setBookingTime] = useState('');
  const [bookingDesc, setBookingDesc] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Review modal
  const [selectedRequestForReview, setSelectedRequestForReview] = useState(null);
  const [userRating, setUserRating] = useState(5);
  const [userReview, setUserReview] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const categories = [
    { id: 'PLUMBER', name: 'Plumbers' },
    { id: 'ELECTRICIAN', name: 'Electricians' },
    { id: 'CLEANING', name: 'Cleaners' },
    { id: 'LAUNDRY', name: 'Laundry' },
    { id: 'CAR_WASH', name: 'Car Wash' },
    { id: 'APPLIANCE_REPAIR', name: 'Appliances' }
  ];

  const fetchProvidersAndBookings = async () => {
    try {
      const [provList, reqList] = await Promise.all([
        serviceService.getProviders(selectedCategory),
        serviceService.getRequests()
      ]);
      setProviders(provList);
      setRequests(reqList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProvidersAndBookings();
  }, [selectedCategory]);

  const handleBook = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    
    try {
      await serviceService.createBooking({
        provider_id: selectedProvider.id,
        description: bookingDesc,
        scheduled_time: bookingTime
      });
      setSelectedProvider(null);
      setBookingTime('');
      setBookingDesc('');
      fetchProvidersAndBookings();
    } catch (err) {
      alert('Failed to book provider.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewLoading(true);

    try {
      await serviceService.updateRequest(selectedRequestForReview.id, {
        rating: userRating,
        review: userReview
      });
      setSelectedRequestForReview(null);
      setUserRating(5);
      setUserReview('');
      fetchProvidersAndBookings();
    } catch (err) {
      alert('Failed to submit review.');
    } finally {
      setReviewLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold">Requested</span>;
      case 'ACCEPTED':
        return <span className="bg-yellow-50 text-yellow-700 text-[10px] px-2 py-0.5 rounded font-bold">Accepted</span>;
      case 'SCHEDULED':
        return <span className="bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded font-bold">Scheduled</span>;
      case 'IN_PROGRESS':
        return <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold">In Progress</span>;
      case 'COMPLETED':
        return <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold">Completed</span>;
      case 'CANCELLED':
        return <span className="bg-red-50 text-red-700 text-[10px] px-2 py-0.5 rounded font-bold">Cancelled</span>;
      default:
        return <span className="bg-gray-50 text-gray-500 text-[10px] px-2.5 py-0.5 rounded font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Local Handyman Services</h2>
          <p className="text-sm text-gray-400">Hire verified plumbers, electricians, or cleaners for repairs inside your apartment.</p>
        </div>
      </div>

      {/* Categories Filter bar */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
            selectedCategory === '' 
              ? 'bg-green-600 border-green-600 text-white shadow-sm' 
              : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-55'
          }`}
        >
          All Categories
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
              selectedCategory === c.id 
                ? 'bg-green-600 border-green-600 text-white shadow-sm' 
                : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-55'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-xs text-gray-400">Loading service registry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Service Providers grid */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2 text-left">Verified Technicians</h3>
            {providers.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm text-gray-400 text-xs font-semibold">
                No active service providers registered in this category.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {providers.map(p => (
                  <div key={p.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between gap-4 text-left">
                    <div className="space-y-1">
                      <span className="text-[9px] bg-green-50 text-green-700 font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">{p.category}</span>
                      <h4 className="font-bold text-sm text-gray-800 mt-2">{p.business_name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2">{p.bio || 'Verified community handyman provider.'}</p>
                      <div className="flex items-center gap-1 mt-1 text-amber-500">
                        <Star size={14} className="fill-amber-500" />
                        <span className="text-xs font-bold">{p.rating.toFixed(1)} / 5.0</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedProvider(p)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-xs transition-colors"
                    >
                      Book Service
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Job bookings list */}
          <div className="bg-white p-6 border border-gray-100 shadow-sm rounded-xl space-y-4 text-left">
            <h3 className="font-bold text-base text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Clock size={18} className="text-gray-400" /> Your Bookings
            </h3>
            <div className="space-y-4">
              {requests.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-12">No service bookings made.</p>
              ) : (
                requests.map(req => (
                  <div key={req.id} className="p-4 bg-gray-50 border border-gray-100 rounded-lg flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-gray-400 font-semibold">{new Date(req.scheduled_time).toLocaleString()}</span>
                      {getStatusBadge(req.status)}
                    </div>
                    <p className="text-xs text-gray-600 font-medium">{req.description}</p>
                    {req.status === 'COMPLETED' && !req.rating && (
                      <button 
                        onClick={() => setSelectedRequestForReview(req)}
                        className="w-full py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold rounded-lg mt-1"
                      >
                        Leave Rating & Review
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4 text-left">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Book {selectedProvider.business_name}</h3>
              <p className="text-xs text-gray-400">Request service scheduling details.</p>
            </div>

            <form onSubmit={handleBook} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Appoint Date & Time</label>
                <input 
                  type="datetime-local" required value={bookingTime} onChange={(e) => setBookingTime(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Job Description</label>
                <textarea 
                  required rows={3} value={bookingDesc} onChange={(e) => setBookingDesc(e.target.value)}
                  placeholder="e.g. Toilet tank leaking / bedroom ceiling fan wiring spark..."
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                />
              </div>

              <div className="flex gap-4 justify-end pt-2">
                <button type="button" onClick={() => setSelectedProvider(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={bookingLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:bg-green-400">
                  {bookingLoading ? 'Requesting...' : 'Request Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedRequestForReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4 text-left">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Job Completion Review</h3>
              <p className="text-xs text-gray-400">Rate your experience with the service provider.</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Rating Star Score (1-5)</label>
                <div className="flex gap-2 py-2">
                  {[1, 2, 3, 4, 5].map(starVal => (
                    <button 
                      key={starVal}
                      type="button" 
                      onClick={() => setUserRating(starVal)}
                      className="text-amber-500"
                    >
                      <Star size={24} className={userRating >= starVal ? 'fill-amber-500' : ''} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Feedback Comment</label>
                <textarea 
                  required rows={3} value={userReview} onChange={(e) => setUserReview(e.target.value)}
                  placeholder="Tell us about the provider's professionalism, SLA speed, and quality of work..."
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                />
              </div>

              <div className="flex gap-4 justify-end pt-2">
                <button type="button" onClick={() => setSelectedRequestForReview(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={reviewLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:bg-green-400">
                  {reviewLoading ? 'Submitting feedback...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalServices;

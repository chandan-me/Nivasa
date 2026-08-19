import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { marketplaceService } from '../services/marketplaceService';
import { chatService } from '../services/chatService';
import { ShoppingBag, Landmark, Key, HelpCircle, Plus, AlertCircle, MessageSquare } from 'lucide-react';

const Marketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('classifieds');
  const [listings, setListings] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [lostFound, setLostFound] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showListingModal, setShowListingModal] = useState(false);
  const [listingTitle, setListingTitle] = useState('');
  const [listingDesc, setListingDesc] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [listingCondition, setListingCondition] = useState('GOOD');
  const [listingType, setListingType] = useState('BUY_SELL');
  const [listingImage, setListingImage] = useState('');
  const [listingLoading, setListingLoading] = useState(false);

  // Rental Request Modal
  const [selectedRentalItem, setSelectedRentalItem] = useState(null);
  const [rentalStart, setRentalStart] = useState('');
  const [rentalEnd, setRentalEnd] = useState('');
  const [rentalLoading, setRentalLoading] = useState(false);

  // Lost & Found Form Modal
  const [showLostFoundModal, setShowLostFoundModal] = useState(false);
  const [lfTitle, setLfTitle] = useState('');
  const [lfDesc, setLfDesc] = useState('');
  const [lfType, setLfType] = useState('LOST');
  const [lfLocation, setLfLocation] = useState('');
  const [lfDate, setLfDate] = useState('');
  const [lfImage, setLfImage] = useState('');
  const [lfLoading, setLfLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'classifieds') {
        const data = await marketplaceService.getListings();
        // filter out RENT/BORROW type if classifieds
        setListings(data.filter(l => ['BUY_SELL', 'GIVE_AWAY'].includes(l.listing_type)));
      } else if (activeTab === 'rentals') {
        const [items, rents] = await Promise.all([
          marketplaceService.getListings(),
          marketplaceService.getRentals()
        ]);
        setListings(items.filter(l => ['RENT', 'BORROW'].includes(l.listing_type)));
        setRentals(rents);
      } else if (activeTab === 'lostfound') {
        const data = await marketplaceService.getLostFound();
        setLostFound(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setListingLoading(true);
    try {
      await marketplaceService.createListing({
        title: listingTitle,
        description: listingDesc,
        price: listingPrice ? parseFloat(listingPrice) : null,
        condition: listingCondition,
        listing_type: listingType,
        image_url: listingImage || null
      });
      setShowListingModal(false);
      setListingTitle('');
      setListingDesc('');
      setListingPrice('');
      setListingCondition('GOOD');
      setListingImage('');
      fetchData();
    } catch (err) {
      alert('Failed to publish listing.');
    } finally {
      setListingLoading(false);
    }
  };

  const handleContactOwner = async (ownerId) => {
    try {
      const conv = await chatService.startConversation(ownerId);
      navigate('/chat', { state: { openConversationId: conv.id } });
    } catch (err) {
      alert('Cannot start a chat session with item owner.');
    }
  };

  const handleRentalRequest = async (e) => {
    e.preventDefault();
    setRentalLoading(true);
    try {
      await marketplaceService.requestRental({
        listing_id: selectedRentalItem.id,
        start_date: rentalStart,
        end_date: rentalEnd
      });
      setSelectedRentalItem(null);
      setRentalStart('');
      setRentalEnd('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit rental request.');
    } finally {
      setRentalLoading(false);
    }
  };

  const handleUpdateRental = async (rentalId, status) => {
    try {
      await marketplaceService.updateRentalStatus(rentalId, status);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update rental.');
    }
  };

  const handleCreateLostFound = async (e) => {
    e.preventDefault();
    setLfLoading(true);
    try {
      await marketplaceService.createLostFound({
        title: lfTitle,
        description: lfDesc,
        item_type: lfType,
        location: lfLocation,
        date_reported: lfDate,
        image_url: lfImage || null
      });
      setShowLostFoundModal(false);
      setLfTitle('');
      setLfDesc('');
      setLfLocation('');
      setLfDate('');
      setLfImage('');
      fetchData();
    } catch (err) {
      alert('Failed to report item.');
    } finally {
      setLfLoading(false);
    }
  };

  const getConditionLabel = (cond) => {
    switch (cond) {
      case 'NEW': return 'New';
      case 'LIKE_NEW': return 'Like New';
      case 'GOOD': return 'Good';
      case 'FAIR': return 'Fair';
      default: return 'Poor';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Community Marketplace</h2>
          <p className="text-sm text-gray-400">Trade or share items, schedule tools sharing, and report missing objects.</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'lostfound' ? (
            <button 
              onClick={() => setShowLostFoundModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2"
            >
              <Plus size={16} /> Report Item
            </button>
          ) : (
            <button 
              onClick={() => {
                setListingType(activeTab === 'rentals' ? 'RENT' : 'BUY_SELL');
                setShowListingModal(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2"
            >
              <Plus size={16} /> Add Listing
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 gap-6">
        {[
          { id: 'classifieds', label: 'Classifieds (Buy/Sell)', icon: <ShoppingBag size={16} /> },
          { id: 'rentals', label: 'Borrow & Rent', icon: <Key size={16} /> },
          { id: 'lostfound', label: 'Lost & Found', icon: <HelpCircle size={16} /> }
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
          <p className="mt-2 text-xs text-gray-400">Loading marketplace listing registry...</p>
        </div>
      ) : (
        <div className="space-y-6 text-left">
          
          {/* CLASSIFIEDS TAB */}
          {activeTab === 'classifieds' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-gray-400 text-xs font-semibold">No active listings found.</div>
              ) : (
                listings.map(item => (
                  <div key={item.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div className="p-5 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="bg-green-50 text-green-700 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase">
                          {item.listing_type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-400 font-semibold">{getConditionLabel(item.condition)}</span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-800 mt-2">{item.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
                      <h3 className="text-base font-extrabold text-gray-800">
                        {item.price ? `$${parseFloat(item.price).toFixed(2)}` : 'Free'}
                      </h3>
                    </div>
                    {item.user_id !== user.id && (
                      <div className="px-5 pb-5 pt-2 border-t border-gray-50 flex gap-2">
                        <button 
                          onClick={() => handleContactOwner(item.user_id)}
                          className="w-full bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare size={14} /> Contact Seller
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* RENTALS TAB */}
          {activeTab === 'rentals' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Listings Grid */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2">Available Items</h3>
                {listings.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs font-semibold">No tools or items available for rent/borrow.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {listings.map(item => (
                      <div key={item.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] bg-green-50 text-green-700 font-extrabold px-2 py-0.5 rounded uppercase">{item.listing_type}</span>
                          <h4 className="font-bold text-xs text-gray-800 mt-2">{item.title}</h4>
                          <p className="text-[11px] text-gray-500 line-clamp-2">{item.description}</p>
                          <h4 className="font-extrabold text-sm text-gray-800">
                            {item.price ? `$${parseFloat(item.price).toFixed(2)} / day` : 'Free Borrow'}
                          </h4>
                        </div>
                        {item.user_id !== user.id && (
                          <button 
                            onClick={() => setSelectedRentalItem(item)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-xs transition-colors"
                          >
                            Request Borrow/Rent
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Contracts list */}
              <div className="bg-white p-6 border border-gray-100 rounded-xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2">Active Rental Bookings</h3>
                <div className="space-y-4">
                  {rentals.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-12">No active rental logs.</p>
                  ) : (
                    rentals.map(rent => {
                      const isOwner = rent.owner_id === user.id;
                      return (
                        <div key={rent.id} className="p-4 bg-gray-50 border border-gray-100 rounded-lg flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] bg-green-150 text-green-700 font-bold px-2 py-0.5 rounded">{rent.status}</span>
                            <span className="text-[10px] text-gray-400 font-semibold">{isOwner ? 'Your Item' : 'Borrowed'}</span>
                          </div>
                          <p className="text-xs text-gray-500">Dates: {new Date(rent.start_date).toLocaleDateString()} to {new Date(rent.end_date).toLocaleDateString()}</p>
                          
                          {/* Owner actions */}
                          {isOwner && rent.status === 'REQUESTED' && (
                            <div className="flex gap-2 mt-2">
                              <button 
                                onClick={() => handleUpdateRental(rent.id, 'CANCELLED')}
                                className="flex-1 py-1.5 border border-red-200 text-red-700 text-[10px] font-bold rounded-lg hover:bg-red-50"
                              >
                                Decline
                              </button>
                              <button 
                                onClick={() => handleUpdateRental(rent.id, 'ACCEPTED')}
                                className="flex-1 py-1.5 bg-green-600 text-white text-[10px] font-bold rounded-lg hover:bg-green-700"
                              >
                                Accept
                              </button>
                            </div>
                          )}

                          {isOwner && rent.status === 'ACCEPTED' && (
                            <button 
                              onClick={() => handleUpdateRental(rent.id, 'ACTIVE')}
                              className="w-full py-1.5 bg-green-600 text-white text-[10px] font-bold rounded-lg mt-2"
                            >
                              Handover (Start Rent)
                            </button>
                          )}

                          {isOwner && rent.status === 'ACTIVE' && (
                            <button 
                              onClick={() => handleUpdateRental(rent.id, 'COMPLETED')}
                              className="w-full py-1.5 bg-green-600 text-white text-[10px] font-bold rounded-lg mt-2"
                            >
                              Returned (Complete)
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LOST & FOUND TAB */}
          {activeTab === 'lostfound' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {lostFound.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-gray-400 text-xs font-semibold">No items reported missing or found.</div>
              ) : (
                lostFound.map(item => (
                  <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          item.item_type === 'LOST' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {item.item_type}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">{new Date(item.date_reported).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-xs text-gray-800">{item.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
                      <p className="text-[10px] text-gray-400 font-semibold">Location: <span className="text-gray-700">{item.location}</span></p>
                    </div>
                    {item.user_id !== user.id && (
                      <button 
                        onClick={() => handleContactOwner(item.user_id)}
                        className="w-full bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare size={14} /> Claim / Contact
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      )}

      {/* Listing Modal */}
      {showListingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4 text-left">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Add Marketplace Listing</h3>
              <p className="text-xs text-gray-400">Share or trade an item with neighbors.</p>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Item Title</label>
                <input 
                  type="text" required value={listingTitle} onChange={(e) => setListingTitle(e.target.value)} 
                  placeholder="e.g. Wooden Coffee Table / Mountain Bike"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Description</label>
                <textarea 
                  required rows={3} value={listingDesc} onChange={(e) => setListingDesc(e.target.value)}
                  placeholder="Provide item specifications, age, condition details..."
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Transaction Type</label>
                  <select 
                    value={listingType} onChange={(e) => setListingType(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    <option value="BUY_SELL">Sell Item</option>
                    <option value="RENT">Rent Out</option>
                    <option value="BORROW">Lend (Free Borrow)</option>
                    <option value="GIVE_AWAY">Give Away (Free)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Price (Leave blank if Free)</label>
                  <input 
                    type="number" value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} 
                    placeholder="e.g. 50"
                    disabled={['BORROW', 'GIVE_AWAY'].includes(listingType)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500 disabled:bg-gray-100" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Condition</label>
                  <select 
                    value={listingCondition} onChange={(e) => setListingCondition(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    <option value="NEW">New</option>
                    <option value="LIKE_NEW">Like New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Image Link (Optional)</label>
                  <input 
                    type="text" value={listingImage} onChange={(e) => setListingImage(e.target.value)} 
                    placeholder="https://example.com/item.jpg"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none" 
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-2">
                <button type="button" onClick={() => setShowListingModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={listingLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:bg-green-400">
                  {listingLoading ? 'Publishing...' : 'Add Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Borrow/Rent Booking Modal */}
      {selectedRentalItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4 text-left">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Borrow/Rent: {selectedRentalItem.title}</h3>
              <p className="text-xs text-gray-400">Specify dates for items reservation.</p>
            </div>

            <form onSubmit={handleRentalRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Start Date</label>
                  <input 
                    type="date" required value={rentalStart} onChange={(e) => setRentalStart(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">End Date</label>
                  <input 
                    type="date" required value={rentalEnd} onChange={(e) => setRentalEnd(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-2">
                <button type="button" onClick={() => setSelectedRentalItem(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={rentalLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:bg-green-400">
                  {rentalLoading ? 'Submitting request...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lost & Found Modal */}
      {showLostFoundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 space-y-4 text-left">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Report Lost or Found Item</h3>
              <p className="text-xs text-gray-400">Report details to help verify claims.</p>
            </div>

            <form onSubmit={handleCreateLostFound} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Item Name</label>
                <input 
                  type="text" required value={lfTitle} onChange={(e) => setLfTitle(e.target.value)} 
                  placeholder="e.g. Black Leather Wallet / Golden Keyring"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Item Description</label>
                <textarea 
                  required rows={2} value={lfDesc} onChange={(e) => setLfDesc(e.target.value)}
                  placeholder="Describe key features, content inside wallet, card initials..."
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Report Type</label>
                  <select 
                    value={lfType} onChange={(e) => setLfType(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    <option value="LOST">I Lost Something</option>
                    <option value="FOUND">I Found Something</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Date of Incident</label>
                  <input 
                    type="date" required value={lfDate} onChange={(e) => setLfDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Approximate Location</label>
                <input 
                  type="text" required value={lfLocation} onChange={(e) => setLfLocation(e.target.value)}
                  placeholder="e.g. Near kids play garden sand / clubhouse gym locker"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500" 
                />
              </div>

              <div className="flex gap-4 justify-end pt-2">
                <button type="button" onClick={() => setShowLostFoundModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={lfLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:bg-green-400">
                  {lfLoading ? 'Submitting...' : 'File Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;

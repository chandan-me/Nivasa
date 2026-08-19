import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { interactionsService } from '../services/interactionsService';
import { Megaphone, CheckSquare, Calendar, Folder, Pin, Vote, Check, ShieldAlert } from 'lucide-react';

const Interactions = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('announcements');

  const [announcements, setAnnouncements] = useState([]);
  const [polls, setPolls] = useState([]);
  const [events, setEvents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [annData, pollData, eventData, docData] = await Promise.all([
        interactionsService.getAnnouncements(),
        interactionsService.getPolls(),
        interactionsService.getEvents(),
        interactionsService.getDocuments()
      ]);
      setAnnouncements(annData);
      setPolls(pollData);
      setEvents(eventData);
      setDocuments(docData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVote = async (pollId, optionId) => {
    try {
      await interactionsService.votePoll(pollId, optionId);
      fetchData(); // Reload votes
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit vote');
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      await interactionsService.rsvpEvent(eventId, status);
      fetchData(); // Reload event list
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update RSVP');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-800">Connected Community</h2>
        <p className="text-sm text-gray-400">Read community bulletins, take part in local polls, RSVP to events, and download policy files.</p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-100 gap-6">
        {[
          { id: 'announcements', label: 'Announcements', icon: <Megaphone size={16} /> },
          { id: 'polls', label: 'Community Polls', icon: <CheckSquare size={16} /> },
          { id: 'events', label: 'Events Calendar', icon: <Calendar size={16} /> },
          { id: 'documents', label: 'Documents Library', icon: <Folder size={16} /> }
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
          <p className="mt-2 text-xs text-gray-400">Loading interactions...</p>
        </div>
      ) : (
        <div className="space-y-6 text-left">
          
          {/* ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <div className="space-y-4 max-w-3xl">
              {announcements.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs font-semibold">No announcements have been made.</div>
              ) : (
                announcements.map(ann => (
                  <div key={ann.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col gap-3 relative">
                    <div className="flex items-center gap-2">
                      {ann.is_pinned && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                          <Pin size={10} /> Pinned
                        </span>
                      )}
                      <h4 className="font-extrabold text-sm text-gray-800">{ann.title}</h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{ann.content}</p>
                    <div className="text-[10px] text-gray-400 font-semibold border-t border-gray-50 pt-2 flex justify-between">
                      <span>Green Valley Bulletin Board</span>
                      <span>Published: {new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* POLLS TAB */}
          {activeTab === 'polls' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {polls.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-gray-400 text-xs font-semibold">No active polls.</div>
              ) : (
                polls.map(poll => {
                  const totalVotes = poll.options.reduce((sum, o) => sum + (o.vote_count || 0), 0);
                  const isVoted = !!poll.user_voted_option_id;
                  const isExpired = new Date(poll.expires_at) < new Date();

                  return (
                    <div key={poll.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-800">{poll.question}</h4>
                        <p className="text-[10px] text-gray-400 font-semibold mt-1">
                          {isExpired ? 'Poll Closed' : `Expires: ${new Date(poll.expires_at).toLocaleDateString()}`} | Total votes: {totalVotes}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {poll.options.map(opt => {
                          const votes = opt.vote_count || 0;
                          const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                          const selected = poll.user_voted_option_id === opt.id;

                          return (
                            <div key={opt.id} className="relative flex flex-col">
                              {isVoted || isExpired ? (
                                <div className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex items-center justify-between overflow-hidden relative">
                                  {/* Progress bar background */}
                                  <div className="absolute left-0 top-0 bottom-0 bg-green-100 transition-all z-0" style={{ width: `${percent}%` }}></div>
                                  <span className="text-xs font-bold text-gray-700 z-10 flex items-center gap-1.5">
                                    {selected && <Check size={14} className="text-green-600" />} {opt.option_text}
                                  </span>
                                  <span className="text-xs font-black text-gray-800 z-10">{percent}% ({votes})</span>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handleVote(poll.id, opt.id)}
                                  className="w-full border border-gray-200 hover:border-green-500 rounded-lg p-3 text-xs font-semibold text-gray-700 hover:text-green-700 text-left transition-all hover:bg-green-50/50"
                                >
                                  {opt.option_text}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === 'events' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-gray-400 text-xs font-semibold">No scheduled events.</div>
              ) : (
                events.map(evt => (
                  <div key={evt.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <span className="bg-green-50 text-green-700 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase">{evt.status}</span>
                      <h4 className="font-extrabold text-sm text-gray-800">{evt.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-3">{evt.description}</p>
                      <div className="text-[10px] text-gray-400 font-semibold space-y-0.5">
                        <p>Location: <span className="text-gray-700">{evt.location}</span></p>
                        <p>Time: <span className="text-gray-700">{new Date(evt.start_time).toLocaleString()}</span></p>
                      </div>
                    </div>

                    <div className="border-t border-gray-50 pt-4 flex items-center justify-between gap-4">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Are you attending?</span>
                      <div className="flex gap-2">
                        {['YES', 'NO', 'MAYBE'].map(statusOption => (
                          <button
                            key={statusOption}
                            onClick={() => handleRSVP(evt.id, statusOption)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                              evt.user_rsvp_status === statusOption
                                ? 'bg-green-600 border-green-600 text-white shadow-sm'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-55'
                            }`}
                          >
                            {statusOption}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="max-w-3xl space-y-4">
              {documents.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs font-semibold">No documents uploaded.</div>
              ) : (
                documents.map(doc => (
                  <div key={doc.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-green-200 transition-all">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-gray-800">{doc.title}</h4>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">{doc.category} | Uploaded: {new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                    <a 
                      href={doc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-green-50 hover:bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-lg font-bold"
                    >
                      Download
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Interactions;

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { Send, User, MessageSquare } from 'lucide-react';

const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);

  const loadConversations = async (autoSelectId = null) => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
      
      // Auto select conversation if passed in navigation state
      const targetId = autoSelectId || location.state?.openConversationId;
      if (targetId) {
        const found = data.find(c => c.id === targetId);
        if (found) {
          setActiveConv(found);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [location]);

  useEffect(() => {
    let interval;
    if (activeConv) {
      const fetchMsgs = async () => {
        try {
          const data = await chatService.getMessages(activeConv.id);
          setMessages(data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchMsgs();
      interval = setInterval(fetchMsgs, 5000); // Poll every 5s
    } else {
      setMessages([]);
    }
    return () => clearInterval(interval);
  }, [activeConv]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeConv) return;

    try {
      const newMsg = await chatService.sendMessage(activeConv.id, typedMessage);
      setMessages(prev => [...prev, newMsg]);
      setTypedMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve counterparty name
  const getRecipientName = (conv) => {
    // Standard sorting keys: user1 or user2 is counterparty
    if (conv.user1_id === user.id) {
      return 'Neighbor'; // Simplified or can pull from backend if mapped, for simplicity:
    }
    return 'Neighbor';
  };

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden h-[calc(100vh-140px)] flex">
      {/* Conversations side panel */}
      <div className="w-80 border-r border-gray-100 flex flex-col h-full text-left">
        <div className="p-4 border-b border-gray-50 font-bold text-gray-800 text-sm">
          Active Chat Rooms
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400 font-semibold">No active conversations. Start one from the Marketplace or Directory.</div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.id} 
                onClick={() => setActiveConv(conv)}
                className={`p-4 cursor-pointer hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                  activeConv?.id === conv.id ? 'bg-green-50/50 border-l-4 border-green-500' : ''
                }`}
              >
                <div className="w-9 h-9 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
                  <User size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-xs text-gray-700">Chat Session</h4>
                  <p className="text-[10px] text-gray-400 font-semibold truncate">
                    {conv.messages?.[conv.messages.length - 1]?.content || 'Start conversing...'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-gray-50/50">
        {activeConv ? (
          <>
            {/* Conversation Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 text-left">
              <div className="w-9 h-9 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                <User size={18} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-800">Community Chat Thread</h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase">Active session</p>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map(msg => {
                const isOwn = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-xl px-4 py-2.5 shadow-sm text-xs leading-relaxed ${
                      isOwn 
                        ? 'bg-green-600 text-white rounded-tr-none text-right' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none text-left'
                    }`}>
                      <p>{msg.content}</p>
                      <span className={`text-[8px] mt-1 block ${isOwn ? 'text-green-200' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-100 p-4 flex gap-4">
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500"
              />
              <button 
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-lg transition-colors shadow-sm"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400 text-xs font-semibold">
            <MessageSquare size={36} />
            <span>Select a chat thread from the panel to start messaging.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

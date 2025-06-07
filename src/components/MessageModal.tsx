import React, { useState, useEffect } from 'react';
import supabase from '../lib/supabase/client';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id?: string;
  application_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  content: string;
  read: boolean;
  created_at?: string;
  // Optional field to store sender name when needed
  sender_name?: string;
}

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  applicationTitle: string;
}

const MessageModal: React.FC<MessageModalProps> = ({ 
  isOpen, 
  onClose, 
  applicationId,
  applicationTitle 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
    // Check if the user is an admin when the component mounts
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .single();
        
      setIsAdmin(profile?.role === 'admin');
    };
    
    checkUserRole();
  }, [user]);
  useEffect(() => {
    if (!isOpen || !applicationId) return;
    
    fetchMessages();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `application_id=eq.${applicationId}`
        },        
        async (payload) => {          
          const newMessage = payload.new as Message;
          
          // Skip if this message was sent by the current user (already handled by optimistic UI)
          if (newMessage.sender_id === user?.id) {
            return;
          }
          
          setMessages(current => [...current, newMessage]);
            
          // Increment unread count if message is from other party
          if ((isAdmin && newMessage.sender_type === 'user') || 
              (!isAdmin && newMessage.sender_type === 'admin')) {
            setUnreadCount(prev => prev + 1);
          }          // Handle name enrichment based on sender type and user role
          if (isAdmin) {
            // For admins: Fetch name for both user messages and admin messages
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name, role')
              .eq('id', newMessage.sender_id)
              .single();
              
            if (senderProfile) {
              // Properly format name with consistent capitalization
              const firstName = senderProfile.first_name ? senderProfile.first_name.charAt(0).toUpperCase() + senderProfile.first_name.slice(1) : '';
              const lastName = senderProfile.last_name ? senderProfile.last_name.charAt(0).toUpperCase() + senderProfile.last_name.slice(1) : '';
              const fullName = [firstName, lastName].filter(Boolean).join(' ') || 
                (senderProfile.role === 'admin' ? 'Admin' : 'User');
                
              // Add sender name to the message
              setMessages(current => 
                current.map(msg => 
                  msg.id === newMessage.id ? { ...msg, sender_name: fullName } : msg
                )
              );
            }
          }          // For users, always set admin messages to have a sender name
          else if (!isAdmin && newMessage.sender_type === 'admin') {
            // Use the sender_name from the message or default to 'Admin'
            const adminName = newMessage.sender_name || 'Admin';
            
            // Always update the message with admin name for consistency
            setMessages(current => 
              current.map(msg => 
                msg.id === newMessage.id ? { ...msg, sender_name: adminName } : msg
              )
            );
          }
        }
      )
      .subscribe();
    
    // Mark messages as read when modal opens
    markUserMessagesAsRead();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, applicationId, isAdmin, user?.id]);  const fetchMessages = async () => {
    if (!applicationId) return;
    
    setLoading(true);
    
    // Use specific ordering to ensure consistent message display
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      // Convert null values to empty arrays
      const messagesData = data || [];
      
      // Enrich messages with sender names
      let enrichedMessages = [...messagesData];
        if (isAdmin) {
        // Get unique user IDs from user messages
        const userIds = [...new Set(
          enrichedMessages
            .filter(msg => msg.sender_type === 'user')
            .map(msg => msg.sender_id)
        )];
        
        // Get unique admin IDs from admin messages (excluding current user)
        const adminIds = [...new Set(
          enrichedMessages
            .filter(msg => msg.sender_type === 'admin')
            .map(msg => msg.sender_id)
        )];
        
        // Fetch all profiles in a single query (both users and admins)
        const allProfileIds = [...userIds, ...adminIds];
        
        if (allProfileIds.length > 0) {
          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, role')
            .in('id', allProfileIds);
            
          // Create a mapping of user/admin ID to name
          const nameMap: { [key: string]: string } = {};
          
          if (allProfiles) {
            allProfiles.forEach(profile => {
              // Format each name consistently with proper capitalization
              const firstName = profile.first_name ? profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1) : '';
              const lastName = profile.last_name ? profile.last_name.charAt(0).toUpperCase() + profile.last_name.slice(1) : '';
              const fullName = [firstName, lastName].filter(Boolean).join(' ') || (profile.role === 'admin' ? 'Admin' : 'User');
              
              nameMap[profile.id] = fullName;
            });
          }
                  // Enhance messages with sender names from the nameMap
          enrichedMessages = enrichedMessages.map(msg => {
            // For user messages, use the name from nameMap
            if (msg.sender_type === 'user' && nameMap[msg.sender_id]) {
              return { ...msg, sender_name: nameMap[msg.sender_id] };
            }
            // For admin messages, use name from nameMap or existing sender_name
            else if (msg.sender_type === 'admin') {
              // Use existing sender_name if it exists, otherwise use the name from nameMap or default to 'Admin'
              const adminName = msg.sender_name || (nameMap[msg.sender_id] || 'Admin');
              return { ...msg, sender_name: adminName };
            }
            return msg;
          });
        }
      }
      
      // Fix any inconsistencies in capitalization for sender names
      enrichedMessages = enrichedMessages.map(msg => {
        if (msg.sender_name && msg.sender_type === 'user') {
          // Ensure proper capitalization of names
          const nameParts = msg.sender_name.split(' ');
          const formattedName = nameParts.map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join(' ');
          
          return { ...msg, sender_name: formattedName };
        }
        return msg;
      });
      
      setMessages(enrichedMessages || []);
      
      // Count unread messages based on user role
      const unreadMessages = enrichedMessages.filter(msg => 
        // If admin, count unread from users; if user, count unread from admins
        msg.sender_type === (isAdmin ? 'user' : 'admin') && !msg.read
      ).length || 0;
      
      setUnreadCount(unreadMessages);
    }
    setLoading(false);
  };
  const markUserMessagesAsRead = async () => {
    if (!applicationId || !user?.id) return;
    
    // Mark messages as read based on user role
    await supabase
      .from('messages')
      .update({ read: true })
      .match({ 
        application_id: applicationId,
        // If admin, mark messages from users as read; if user, mark messages from admins as read
        sender_type: isAdmin ? 'user' : 'admin',
        read: false
      });
      
    // Update local state to reflect read status
    setMessages(current => 
      current.map(msg => 
        msg.sender_type === (isAdmin ? 'user' : 'admin') ? { ...msg, read: true } : msg
      )
    );
    
    setUnreadCount(0);
  };  const sendMessage = async () => {
    if (!newMessage.trim() || !applicationId || !user?.id) return;
    
    // Get admin's name if this message is from an admin
    let adminName = 'Admin';
    if (isAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
        
      if (profile) {
        // Format name consistently with capitalization
        const firstName = profile.first_name ? profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1) : '';
        const lastName = profile.last_name ? profile.last_name.charAt(0).toUpperCase() + profile.last_name.slice(1) : '';
        adminName = [firstName, lastName].filter(Boolean).join(' ') || 'Admin';
      }
    }
    
    // Create message object for UI update (with temp ID)
    const uiMessage: Message = {
      id: `temp-${Date.now()}`, // Temporary ID for optimistic UI update
      application_id: applicationId,
      sender_id: user.id,
      sender_type: isAdmin ? 'admin' : 'user',
      content: newMessage,
      read: false,
      created_at: new Date().toISOString(), // Add current timestamp
      sender_name: isAdmin ? adminName : undefined // Set proper admin name if applicable
    };
    
    // Create a separate object for database insertion
    const dbMessage = {
      application_id: applicationId,
      sender_id: user.id,
      sender_type: isAdmin ? 'admin' : 'user',
      content: newMessage,
      read: false,
      sender_name: isAdmin ? adminName : undefined // Save admin name in database
    };
    
    // Optimistically update UI
    setMessages(currentMessages => [...currentMessages, uiMessage]);
    setNewMessage(''); // Clear input field immediately
    
    // Send to database
    const { error, data } = await supabase
      .from('messages')
      .insert(dbMessage);
      
    if (error) {
      console.error('Error sending message:', error);
      
      // Remove the temporary message on error
      setMessages(currentMessages => 
        currentMessages.filter(msg => msg.id !== uiMessage.id)
      );
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 relative text-gray-900 flex flex-col h-[80vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Messages - {applicationTitle}
          </h3>
          <button 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors" 
            onClick={onClose}
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10">
              <div className="inline-flex rounded-full bg-blue-100 p-3 mb-4">
                <svg className="w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-1">No messages yet</p>
              <p className="text-sm text-gray-400">Send a message to start the conversation</p>
            </div>
          ) : (            messages.map((message, index) => (              <div 
                key={message.id || index}
                className={`p-3 rounded-lg max-w-[80%] flex flex-col ${
                  // For admins: all admin messages should be right-aligned, user messages left-aligned
                  // For users: all user messages should be right-aligned, admin messages left-aligned
                  (isAdmin && message.sender_type === 'admin') || (!isAdmin && message.sender_type === 'user')
                    ? 'bg-blue-100 ml-auto rounded-br-none' 
                    : 'bg-gray-100 rounded-bl-none'
                }`}
              >                {/* Sender name at the top */}                <p className={`text-xs font-medium mb-1 ${
                  (isAdmin && message.sender_type === 'admin') || (!isAdmin && message.sender_type === 'user') 
                    ? 'text-blue-600 text-right' 
                    : 'text-green-600'
                }`}>
                  {message.sender_id === user?.id 
                    ? 'You' 
                    : (isAdmin && message.sender_type === 'admin')
                      ? (message.sender_name || 'Admin') // Other admin
                      : message.sender_name || (message.sender_type === 'admin' ? 'Admin' : 'User')
                  }
                </p>
                
                {/* Message content */}
                <p className="text-sm">{message.content}</p>
                  {/* Timestamp */}
                <p className={`text-xs text-gray-500 mt-1 ${
                  (isAdmin && message.sender_type === 'admin') || (!isAdmin && message.sender_type === 'user')
                    ? 'text-right' 
                    : ''
                }`}>
                  {message.created_at ? new Date(message.created_at).toLocaleString() : 'Sending...'}
                </p>
              </div>
            ))
          )}
        </div>
        
        {/* Message Input */}
        <div className="border-t p-4 flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
          />
          <Button 
            onClick={sendMessage} 
            className="rounded-l-none bg-blue-600 hover:bg-blue-700"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;

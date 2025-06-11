import React, { useState, useEffect, useRef } from 'react';
import supabase from '../lib/supabase/client';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id?: string;
  application_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  content: string;
  read: boolean; // Keep for backward compatibility
  read_by_admin?: boolean;
  read_by_user?: boolean;
  admin_read_at?: string;
  user_read_at?: string;
  created_at?: string;
  updated_at?: string;
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
  const { user } = useAuth();  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userIdRef = useRef<string | null>(null);
  const isAdminRef = useRef<boolean>(false);
  
  // Add a ref to track processed message IDs to prevent duplicates
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Function to scroll to the bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);
  // Check if the user is an admin when the component mounts
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .single();
        
      const adminStatus = profile?.role === 'admin';
      setIsAdmin(adminStatus);
      
      // Update refs to avoid stale closures
      userIdRef.current = user.id;
      isAdminRef.current = adminStatus;
    };
    
    checkUserRole();
  }, [user]);  useEffect(() => {
    if (!isOpen || !applicationId) return;
      // Clear existing messages before fetching new ones when applicationId changes
    setMessages([]);
    // Clear processed message IDs when switching applications
    processedMessageIds.current.clear();
    fetchMessages();
      // Set up real-time subscription
    console.log('🔄 Setting up real-time subscription for application:', applicationId);
    
    // Use a consistent channel name format and add app ID
    const channelName = `messages-realtime-${applicationId}`;
    console.log(`📻 Creating channel: ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Focus on INSERT events for real-time chat
          schema: 'public',
          table: 'messages',
          filter: `application_id=eq.${applicationId}`
        },        async (payload) => {
          console.log('🚀 REAL-TIME MESSAGE RECEIVED:', payload);
          
          const newMessage = payload.new as Message;
          
          // Early exit if we've already processed this message ID
          if (newMessage.id && processedMessageIds.current.has(newMessage.id)) {
            console.log('⚠️ Message already processed, skipping:', newMessage.id);
            return;
          }
          
          // Add to processed set
          if (newMessage.id) {
            processedMessageIds.current.add(newMessage.id);
          }
            // Handle case when message is from current user
          if (newMessage.sender_id === userIdRef.current) {
            console.log('⏭️ This message is from current user:', newMessage.id);
            
            // Check if we already have this message with this ID
            setMessages(currentMessages => {
              // First check: Do we already have this exact message ID?
              const hasSameId = currentMessages.some(msg => msg.id === newMessage.id);
              
              if (hasSameId) {
                console.log('⚠️ Message with ID already exists in state, skipping:', newMessage.id);
                return currentMessages;
              }
              
              // Second check: Do we have a temporary version of this message we should update?
              const tempMessage = currentMessages.find(msg => 
                msg.sender_id === newMessage.sender_id && 
                msg.content === newMessage.content &&
                msg.id && msg.id.toString().startsWith('temp-')
              );
              
              if (tempMessage) {
                console.log('🔄 Updating temporary message with real ID:', newMessage.id);
                return currentMessages.map(msg => {
                  if (msg.id === tempMessage.id) {
                    return { 
                      ...newMessage, 
                      sender_name: tempMessage.sender_name // Preserve sender_name
                    };
                  }
                  return msg;
                });
              }
              
              // If we reach here, it's a new message from us that we hadn't seen before
              return currentMessages;
            });
            return; // Skip further processing
          }
          
          console.log('💬 Adding new message from other user in real-time:', newMessage);
          
          // Add message to UI immediately with sender name enrichment
          let enrichedMessage = { ...newMessage };
          
          // Enrich message with sender name
          if (isAdminRef.current) {
            // For admins: Get sender name for all messages
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name, role')
              .eq('id', newMessage.sender_id)
              .single();
              
            if (senderProfile) {
              const firstName = senderProfile.first_name ? senderProfile.first_name.charAt(0).toUpperCase() + senderProfile.first_name.slice(1) : '';
              const lastName = senderProfile.last_name ? senderProfile.last_name.charAt(0).toUpperCase() + senderProfile.last_name.slice(1) : '';
              const fullName = [firstName, lastName].filter(Boolean).join(' ') || 
                (senderProfile.role === 'admin' ? 'Admin' : 'User');
              enrichedMessage.sender_name = fullName;
            }
          } else if (newMessage.sender_type === 'admin') {
            // For users: Set admin messages to have Admin name
            enrichedMessage.sender_name = newMessage.sender_name || 'Admin';
          }          // Add message to UI immediately - but check for duplicates first
          setMessages(current => {
            console.log('🔎 Checking for duplicates before adding message:', enrichedMessage.id);
            console.log('📊 Current messages count:', current.length);
            
            // Check if this message already exists in our state using multiple criteria
            const isDuplicate = current.some(msg => {
              // 1. Check by UUID first - most reliable
              if (msg.id && enrichedMessage.id && msg.id === enrichedMessage.id) {
                console.log(`⚠️ Duplicate detected by ID: ${msg.id}`);
                return true;
              }
              
              // 2. Check by content, sender ID and timestamps (within 5 seconds for safety)
              if (msg.sender_id === enrichedMessage.sender_id && 
                  msg.content === enrichedMessage.content) {
                  
                if (msg.created_at && enrichedMessage.created_at) {
                  const msgTime = new Date(msg.created_at).getTime();
                  const newMsgTime = new Date(enrichedMessage.created_at).getTime();
                  const timeDiff = Math.abs(msgTime - newMsgTime);
                  
                  // If timestamps are within 5 seconds, consider it a duplicate
                  if (timeDiff < 5000) {
                    console.log(`⚠️ Duplicate detected by content and time: ${msg.content.substring(0, 20)}... (time diff: ${timeDiff}ms)`);
                    return true;
                  }
                } else if (msg.created_at === enrichedMessage.created_at) {
                  // Exact timestamp match
                  console.log(`⚠️ Duplicate detected by content and exact timestamp`);
                  return true;
                }
              }
              
              return false;
            });
            
            if (isDuplicate) {
              console.log('⚠️ Duplicate message detected, not adding to state');
              return current;
            }
            
            console.log('✅ New message, adding to state. New count will be:', current.length + 1);
            return [...current, enrichedMessage];
          });
          
          // Since the modal is open and user can see the message, mark it as read immediately
          // This creates a true chat experience where messages are read as they appear
          setTimeout(async () => {
            console.log('📖 Auto-marking new message as read (modal is open)');
            await markSingleMessageAsRead(enrichedMessage);
          }, 500);
          
          console.log('✅ Real-time message added to chat!');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public', 
          table: 'messages',
          filter: `application_id=eq.${applicationId}`
        },
        (payload) => {
          console.log('📝 Message updated:', payload);
          const updatedMessage = payload.new as Message;
            setMessages(current => 
            current.map(msg => {
              if ((msg.id && msg.id === updatedMessage.id) || 
                  (msg.sender_id === updatedMessage.sender_id && msg.content === updatedMessage.content)) {
                // Preserve the sender_name from the existing message when updating
                return { ...updatedMessage, sender_name: msg.sender_name || updatedMessage.sender_name };
              }
              return msg;
            })
          );
        }
      )
      .subscribe(async (status) => {
        console.log('📡 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active for:', `messages:${applicationId}`);
        } else if (status === 'CLOSED') {
          console.log('❌ Real-time subscription closed');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('🚨 Real-time subscription error');
        }
      });
    
    // Mark messages as read when modal opens
    markUserMessagesAsRead();
      return () => {
      console.log(`🧹 Cleaning up real-time subscription for channel: ${channelName}`);
      if (channel) {
        channel.unsubscribe()
          .then(() => {
            console.log('✅ Channel unsubscribed successfully');
            return supabase.removeChannel(channel);
          })
          .then(() => {
            console.log('✅ Channel removed successfully');
          })
          .catch(err => {
            console.error('❌ Error during channel cleanup:', err);
          });
      }
    };
  }, [isOpen, applicationId, isAdmin, user?.id]);
  
  const fetchMessages = async () => {
    if (!applicationId) return;
    
    console.log('Fetching messages for application:', applicationId);
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
          const nameParts = msg.sender_name.split(' ');          const formattedName = nameParts.map((part: string) => 
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join(' ');
          
          return { ...msg, sender_name: formattedName };
        }        return msg;
      });
        
      // Remove any potential duplicates based on ID before setting state
      const uniqueMessages = enrichedMessages.filter((message, index, arr) => {
        const firstIndex = arr.findIndex(m => m.id === message.id);
        return firstIndex === index; // Keep only the first occurrence of each ID
      });
      
      setMessages(uniqueMessages || []);
      
      // Count unread messages based on user role using new read status tracking
      const unreadMessages = enrichedMessages.filter(msg => {
        // If admin, count unread messages from users that haven't been read by admin
        if (isAdmin && msg.sender_type === 'user') {
          return msg.read_by_admin === false || msg.read_by_admin === undefined;
        }
        // If user, count unread messages from admins that haven't been read by user
        else if (!isAdmin && msg.sender_type === 'admin') {
          return msg.read_by_user === false || msg.read_by_user === undefined;
        }
        return false;
      }).length || 0;
      
      setUnreadCount(unreadMessages);
    }
    setLoading(false);
  };  const markUserMessagesAsRead = async () => {
    if (!applicationId || !user?.id) {
      console.log('❌ Cannot mark messages as read: missing applicationId or user.id');
      return;
    }
    
    console.log(`📖 Marking messages as read for application ${applicationId}, user role: ${isAdmin ? 'admin' : 'user'}`);
    
    try {
      // Determine which messages to mark as read based on user role
      const filterConditions = { 
        application_id: applicationId,
        // If admin, mark messages from users as read; if user, mark messages from admins as read
        sender_type: isAdmin ? 'user' : 'admin'
      };
      
      // Prepare update data based on user role
      const updateData = isAdmin ? {
        read_by_admin: true,
        admin_read_at: new Date().toISOString(),
        read: true // Keep for backward compatibility
      } : {
        read_by_user: true,
        user_read_at: new Date().toISOString(),
        read: true // Keep for backward compatibility
      };
      
      // First, get the messages that need to be updated
      const { data: messagesToUpdate, error: fetchError } = await supabase
        .from('messages')
        .select('id')
        .match(filterConditions)
        .eq(isAdmin ? 'read_by_admin' : 'read_by_user', false);
        
      if (fetchError) {
        console.error('❌ Error fetching messages to update:', fetchError);
        return;
      }
      
      if (!messagesToUpdate || messagesToUpdate.length === 0) {
        console.log('✅ No messages to mark as read');
        return;
      }
      
      // Mark messages as read based on user role
      const { data, error } = await supabase
        .from('messages')
        .update(updateData)
        .match(filterConditions)
        .eq(isAdmin ? 'read_by_admin' : 'read_by_user', false)
        .select('id');
        
      if (error) {
        console.error('❌ Error marking messages as read:', error);
        return;
      }
      
      console.log(`✅ Successfully marked ${data?.length || 0} messages as read`);
      
      // Update local state to reflect read status
      setMessages(current => 
        current.map(msg => {
          if (msg.sender_type === (isAdmin ? 'user' : 'admin')) {
            const updatedMsg = { ...msg };
            if (isAdmin) {
              updatedMsg.read_by_admin = true;
              updatedMsg.admin_read_at = new Date().toISOString();
            } else {
              updatedMsg.read_by_user = true;
              updatedMsg.user_read_at = new Date().toISOString();
            }
            updatedMsg.read = true; // Backward compatibility
            return updatedMsg;
          }
          return msg;
        })
      );    
      setUnreadCount(0);
    } catch (error) {
      console.error('❌ Unexpected error marking messages as read:', error);
    }
  };
  
  // Function to mark a single message as read (for real-time chat)
  const markSingleMessageAsRead = async (message: Message) => {
    if (!user?.id) return;
    
    try {
      // Determine if this message should be marked as read by current user
      const shouldMarkAsRead = (isAdmin && message.sender_type === 'user') || 
                              (!isAdmin && message.sender_type === 'admin');
      
      if (!shouldMarkAsRead) {
        console.log('Message not from other party, skipping read marking');
        return;
      }
      
      // Prepare update data based on user role
      const updateData = isAdmin ? {
        read_by_admin: true,
        admin_read_at: new Date().toISOString(),
        read: true
      } : {
        read_by_user: true,
        user_read_at: new Date().toISOString(), 
        read: true
      };
      
      // Update the specific message
      const { error } = await supabase
        .from('messages')
        .update(updateData)
        .eq('application_id', applicationId)
        .eq('sender_id', message.sender_id)
        .eq('content', message.content)
        .eq('created_at', message.created_at);
        
      if (error) {
        console.error('❌ Error marking single message as read:', error);
      } else {
        console.log('✅ Single message marked as read');
          // Update local state to reflect read status - preserve sender_name
        setMessages(current => 
          current.map(msg => 
            (msg.sender_id === message.sender_id && 
             msg.content === message.content && 
             msg.created_at === message.created_at)
            ? { ...msg, ...updateData, sender_name: msg.sender_name } : msg
          )
        );
      }
    } catch (error) {
      console.error('❌ Error in markSingleMessageAsRead:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !applicationId || !user?.id) return;
    
    console.log('Sending message for application:', applicationId);
    
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
    }    // Create message object for UI update (with unique temp ID)
    const timestamp = new Date().toISOString();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Create a unique client-side message object for optimistic UI
    const uiMessage: Message = {
      id: tempId, // Unique temporary ID that won't conflict with UUID format
      application_id: applicationId,
      sender_id: user.id,
      sender_type: isAdmin ? 'admin' : 'user',
      content: newMessage,
      read: false,
      read_by_admin: isAdmin, // If admin is sending, it's read by admin
      read_by_user: !isAdmin, // If user is sending, it's read by user
      created_at: timestamp, // Add current timestamp
      sender_name: isAdmin ? adminName : undefined // Set proper admin name if applicable
    };
      // Create a separate object for database insertion
    const dbMessage = {
      application_id: applicationId,
      sender_id: user.id,
      sender_type: isAdmin ? 'admin' : 'user',
      content: newMessage,
      read: false, // Keep for backward compatibility      read_by_admin: isAdmin, // If admin is sending, mark as read by admin
      read_by_user: !isAdmin, // If user is sending, mark as read by user
      sender_name: isAdmin ? adminName : undefined // Save admin name in database
    };
    
    // Optimistically update UI
    setMessages(currentMessages => [...currentMessages, uiMessage]);
    setNewMessage(''); // Clear input field immediately    // Send to database
    const { error, data } = await supabase
      .from('messages')
      .insert(dbMessage)
      .select('*'); // Return the inserted record to get the real ID
      
    if (error) {
      console.error('❌ Error sending message:', error);
      // Remove the temporary message on error
      setMessages(currentMessages => 
        currentMessages.filter(msg => msg.id !== uiMessage.id)
      );
      // Restore the message text in input
      setNewMessage(newMessage);
    } else {
      console.log('✅ Message sent successfully to database:', data);
      // Replace temporary message with real one from database
      if (data && data[0]) {
        const realMessage = { ...data[0], sender_name: uiMessage.sender_name };
        setMessages(currentMessages => 
          currentMessages.map(msg => 
            msg.id === uiMessage.id ? realMessage : msg
          )
        );
        console.log('🔄 Replaced temporary message with real database record');
      }
    }
  };

  // Scroll to bottom of messages when they change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
        </div>          {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 chat-scroll">
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
              <p className="text-sm text-gray-400">Send a message to start the conversation</p>            </div>) : (messages.map((message, index) => {
              // Generate a truly unique key for each message with enhanced uniqueness
              const messageKey = message.id && !message.id.toString().startsWith('temp-')
                ? `real-${message.id}` 
                : message.id && message.id.toString().startsWith('temp-')
                  ? `temp-${message.id}` 
                  : `fallback-${message.sender_id}-${message.created_at || Date.now()}-${index}-${Math.random().toString(36).substring(2, 8)}`;
              
              return (
              <div 
                key={messageKey}
                className={`p-3 rounded-lg max-w-[80%] flex flex-col animate-fadeIn shadow-sm transition-all duration-200 ${
                  // For admins: all admin messages should be right-aligned, user messages left-aligned
                  // For users: all user messages should be right-aligned, admin messages left-aligned
                  (isAdmin && message.sender_type === 'admin') || (!isAdmin && message.sender_type === 'user')
                    ? 'bg-blue-600 text-white ml-auto rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >                {/* Sender name at the top */}                <p className={`text-xs font-medium mb-1 ${
                  (isAdmin && message.sender_type === 'admin') || (!isAdmin && message.sender_type === 'user') 
                    ? 'text-blue-100 text-right' 
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
                <p className="text-sm leading-relaxed">{message.content}</p>
                  {/* Timestamp */}
                <p className={`text-xs mt-1 ${
                  (isAdmin && message.sender_type === 'admin') || (!isAdmin && message.sender_type === 'user')
                    ? 'text-blue-200 text-right' 
                    : 'text-gray-500'
                }`}>                  {message.created_at ? new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Sending...'}
                </p>
              </div>
              );
            })
          )}
          
          {/* Dummy div for scrolling to bottom */}
          <div ref={messagesEndRef} className="h-1"></div>
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

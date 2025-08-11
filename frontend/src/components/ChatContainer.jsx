import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { formatMessageTime } from "../lib/utils";
import { Trash2, Edit3 } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedChat,
    isGroupChat,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    editMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const { theme } = useThemeStore();
  const messageEndRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  useEffect(() => {
    if (selectedChat) {
      getMessages(selectedChat._id);
    }

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedChat?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleEditClick = (message) => {
    setEditingMessageId(message._id);
    setEditText(message.text);
  };

  const handleEditSubmit = async (e, messageId) => {
    e.preventDefault();
    if (editText.trim() && editText !== messages.find(m => m._id === messageId)?.text) {
      await editMessage(messageId, editText);
    }
    setEditingMessageId(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  // Function to get sender info for group messages
  const getSenderInfo = (message) => {
    if (!isGroupChat) {
      // For individual chats, sender is either authUser or selectedUser
      return message.senderId === authUser._id ? authUser : selectedChat;
    }
    
    // Check if selectedChat is a valid group object with members array
    if (!selectedChat || !Array.isArray(selectedChat.members)) {
      return { fullName: "Unknown User", profilePic: "/avatar.png" };
    }
    
    // For group chats, find the sender in the group members
    // Ensure both senderId and authUser._id are strings for comparison
    // For group messages, senderId is an object, so we need to get the _id
    // For individual messages, senderId is a string
    const senderId = typeof message.senderId === 'object' && message.senderId !== null
      ? message.senderId._id
      : message.senderId;
      
    if (senderId.toString() === authUser._id.toString()) {
      return authUser;
    }
    
    // Check if senderId is an object (populated) or string (not populated)
    if (typeof message.senderId === 'object' && message.senderId !== null) {
      // senderId is already populated with user object
      return message.senderId;
    } else {
      // senderId is just the user ID string, find in group members
      // Ensure both are strings for comparison
      const sender = selectedChat.members.find(
        (member) => member._id.toString() === message.senderId.toString()
      );
      
      return sender || { fullName: "Unknown User", profilePic: "/avatar.png" };
    }
  };

  // Function to get profile picture for a message
  const getProfilePic = (message) => {
    const sender = getSenderInfo(message);
    return sender?.profilePic || "/avatar.png";
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          // Ensure both senderId and authUser._id are strings for comparison
          // For group messages, senderId is an object, so we need to get the _id
          // For individual messages, senderId is a string
          const senderId = typeof message.senderId === 'object' && message.senderId !== null
            ? message.senderId._id
            : message.senderId;
          const isOwnMessage = senderId.toString() === authUser._id.toString();
          const sender = getSenderInfo(message);
          const isEditing = editingMessageId === message._id;
          
          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
              onMouseEnter={() => setHoveredMessageId(message._id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              <div className=" chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={getProfilePic(message)}
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1 flex items-center">
                {/* Show sender name for group messages */}
                {isGroupChat && !isOwnMessage && (
                  <span className="text-xs font-medium mr-2">
                    {sender?.fullName}
                  </span>
                )}
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
                {isOwnMessage && (
                  <div className={`ml-2 flex ${hoveredMessageId === message._id ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                    <button
                      onClick={() => handleEditClick(message)}
                      className="text-blue-500 hover:text-blue-700 mr-1"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => deleteMessage(message._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="chat-bubble flex flex-col">
                {message.image && !isEditing && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {isEditing ? (
                  <form onSubmit={(e) => handleEditSubmit(e, message._id)} className="flex flex-col">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className={`bg-transparent ${theme === 'dark' ? 'text-white border-gray-500' : 'text-black border-gray-300'} border-b focus:outline-none pb-1 mb-1`}
                      autoFocus
                    />
                    <div className="flex justify-end space-x-2 mt-1">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-xs text-gray-400 hover:text-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {message.text && <p>{message.text}</p>}
                    {message.edited && (
                      <span className="text-xs text-gray-400 mt-1">Edited</span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
import { X, MoreVertical, UserPlus, UserMinus, LogOut, Camera } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState, useRef } from "react";
import AddMemberModal from "./AddMemberModal";
import RemoveMemberModal from "./RemoveMemberModal";

const ChatHeader = () => {
  const {
    selectedChat,
    setSelectedChat,
    isGroupChat,
    addGroupMember,
    removeGroupMember,
    leaveGroup
  } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const fileInputRef = useRef(null);

  if (!selectedChat) return null;

  // Check if user is admin or creator of the group
  const isGroupAdmin = isGroupChat && (
    selectedChat.creator._id === authUser._id ||
    selectedChat.admins.some(admin => admin._id === authUser._id)
  );

  const isGroupCreator = isGroupChat && selectedChat.creator._id === authUser._id;

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      try {
        // Update the group with the new profile picture
        await useChatStore.getState().updateGroup(selectedChat._id, { profilePic: base64Image });
        setShowGroupMenu(false);
      } catch (error) {
        console.error("Error updating group profile picture:", error);
      }
    };
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedChat.profilePic || "/avatar.png"}
                alt={isGroupChat ? selectedChat.name : selectedChat.fullName}
              />
              {isGroupChat ? null : (
                <span className={`absolute bottom-0 right-0 size-3 rounded-full ring-2 ring-base-100
                  ${onlineUsers.includes(selectedChat._id) ? "bg-green-500" : "bg-red-500"}`}
                />
              )}
            </div>
          </div>

          {/* Chat info */}
          <div>
            <h3 className="font-medium">
              {isGroupChat ? selectedChat.name : selectedChat.fullName}
            </h3>
            <p className="text-sm text-base-content/70">
              {isGroupChat
                ? `${selectedChat.members.length} members`
                : (onlineUsers.includes(selectedChat._id) ? "Online" : "Offline")
              }
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isGroupChat && (
            <div className="relative">
              <button onClick={() => setShowGroupMenu(!showGroupMenu)}>
                <MoreVertical size={20} />
              </button>
              
              {showGroupMenu && (
                <div className="absolute right-0 top-8 bg-base-200 rounded-lg shadow-lg z-10 w-48">
                  {isGroupAdmin && (
                    <>
                      <button
                        className="flex items-center gap-2 w-full p-3 hover:bg-base-300 rounded-lg"
                        onClick={() => {
                          setShowAddMemberModal(true);
                          setShowGroupMenu(false);
                        }}
                      >
                        <UserPlus size={16} />
                        Add Member
                      </button>
                      
                      <button
                        className="flex items-center gap-2 w-full p-3 hover:bg-base-300 rounded-lg"
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowGroupMenu(false);
                        }}
                      >
                        <Camera size={16} />
                        Group Photo
                      </button>
                    </>
                  )}
                  
                  {isGroupCreator && (
                    <button
                      className="flex items-center gap-2 w-full p-3 hover:bg-base-300 rounded-lg"
                      onClick={() => {
                        setShowRemoveMemberModal(true);
                        setShowGroupMenu(false);
                      }}
                    >
                      <UserMinus size={16} />
                      Remove Member
                    </button>
                  )}
                  
                  <button
                    className="flex items-center gap-2 w-full p-3 hover:bg-base-300 rounded-lg text-red-500"
                    onClick={() => {
                      leaveGroup(selectedChat._id);
                      setShowGroupMenu(false);
                    }}
                  >
                    <LogOut size={16} />
                    Leave Group
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Close button */}
          <button onClick={() => setSelectedChat(null, false)}>
            <X />
          </button>
        </div>
      </div>

      {/* Hidden file input for profile picture upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleProfilePicUpload}
      />

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddMemberModal
          group={selectedChat}
          onClose={() => setShowAddMemberModal(false)}
        />
      )}

      {/* Remove Member Modal */}
      {showRemoveMemberModal && (
        <RemoveMemberModal
          group={selectedChat}
          onClose={() => setShowRemoveMemberModal(false)}
        />
      )}
    </div>
  );
};
export default ChatHeader;
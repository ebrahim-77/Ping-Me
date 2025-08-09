import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X } from "lucide-react";

const AddMemberModal = ({ group, onClose }) => {
  const { users, addGroupMember } = useChatStore();
  const { authUser } = useAuthStore();
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Filter out users who are already members of the group
  const availableUsers = users.filter(
    (user) => 
      user._id !== authUser._id && 
      !group.members.some(member => member._id === user._id)
  );

  const handleMemberToggle = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedMembers.length === 0) {
      alert("Please select at least one member to add");
      return;
    }

    try {
      // Add each selected member to the group
      for (const memberId of selectedMembers) {
        await addGroupMember(group._id, memberId);
      }
      
      onClose();
    } catch (error) {
      console.error("Error adding members:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add Members to {group.name}</h3>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Members</label>
            <div className="max-h-60 overflow-y-auto">
              {availableUsers.length > 0 ? (
                availableUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg cursor-pointer"
                    onClick={() => handleMemberToggle(user._id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(user._id)}
                      onChange={() => {}}
                      className="checkbox"
                    />
                    <div className="avatar">
                      <div className="size-8 rounded-full">
                        <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
                      </div>
                    </div>
                    <span>{user.fullName}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-zinc-500 py-4">No users available to add</div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={selectedMembers.length === 0}
            >
              Add Members
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
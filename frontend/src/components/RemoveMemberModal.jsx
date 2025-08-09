import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X } from "lucide-react";

const RemoveMemberModal = ({ group, onClose }) => {
  const { removeGroupMember } = useChatStore();
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Filter out the creator - they cannot be removed
  const removableMembers = group.members.filter(
    (member) => member._id !== group.creator._id
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
      alert("Please select at least one member to remove");
      return;
    }

    try {
      // Remove each selected member from the group
      for (const memberId of selectedMembers) {
        await removeGroupMember(group._id, memberId);
      }
      
      onClose();
    } catch (error) {
      console.error("Error removing members:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Remove Members from {group.name}</h3>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Members to Remove</label>
            <div className="max-h-60 overflow-y-auto">
              {removableMembers.length > 0 ? (
                removableMembers.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg cursor-pointer"
                    onClick={() => handleMemberToggle(member._id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member._id)}
                      onChange={() => {}}
                      className="checkbox"
                    />
                    <div className="avatar">
                      <div className="size-8 rounded-full">
                        <img src={member.profilePic || "/avatar.png"} alt={member.fullName} />
                      </div>
                    </div>
                    <span>{member.fullName}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-zinc-500 py-4">No members can be removed</div>
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
              className="btn btn-error"
              disabled={selectedMembers.length === 0}
            >
              Remove Members
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RemoveMemberModal;
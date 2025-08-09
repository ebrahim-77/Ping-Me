import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X } from "lucide-react";

const CreateGroupModal = ({ onClose }) => {
  const { users, createGroup } = useChatStore();
  const { authUser } = useAuthStore();
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleMemberToggle = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    if (selectedMembers.length === 0) {
      alert("Please select at least one member");
      return;
    }

    setIsLoading(true);
    try {
      const groupData = {
        name: groupName,
        members: selectedMembers,
      };
      
      await createGroup(groupData);
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Create Group</h3>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full input input-bordered"
              placeholder="Enter group name"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Members</label>
            <div className="max-h-60 overflow-y-auto">
              {users
                .filter((user) => user._id !== authUser._id) // Exclude self
                .map((user) => (
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
                ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  selectedChat: null, // Can be either a user or a group
  isUsersLoading: false,
  isGroupsLoading: false,
  isMessagesLoading: false,
  isGroupChat: false, // Flag to indicate if the selected chat is a group

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  getMessages: async (chatId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${chatId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedChat, messages, isGroupChat } = get();
    try {
      const endpoint = isGroupChat
        ? `/groups/send/${selectedChat._id}`
        : `/messages/send/${selectedChat._id}`;
      
      const res = await axiosInstance.post(endpoint, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  deleteMessage: async (messageId) => {
    const { messages } = get();
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      // Remove the deleted message from the state
      set({ messages: messages.filter((message) => message._id !== messageId) });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/groups/create", groupData);
      set((state) => ({
        groups: [...state.groups, res.data],
      }));
      toast.success("Group created successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
    }
  },

  addGroupMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.post("/groups/add-member", { groupId, memberId });
      // Update the group in the state
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id.toString() === groupId.toString() ? res.data : group
        ),
      }));
      // If this is the selected group, update it
      set((state) => ({
        selectedChat:
          state.selectedChat && state.selectedChat._id.toString() === groupId.toString()
            ? res.data
            : state.selectedChat,
      }));
      toast.success("Member added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add member");
    }
  },

  removeGroupMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.post("/groups/remove-member", { groupId, memberId });
      // Update the group in the state
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id.toString() === groupId.toString() ? res.data : group
        ),
      }));
      // If this is the selected group, update it
      set((state) => ({
        selectedChat:
          state.selectedChat && state.selectedChat._id.toString() === groupId.toString()
            ? res.data
            : state.selectedChat,
      }));
      toast.success("Member removed successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  },

  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.post(`/groups/leave/${groupId}`);
      // Remove the group from the state
      set((state) => ({
        groups: state.groups.filter((group) => group._id.toString() !== groupId.toString()),
      }));
      // If this is the selected group, clear the selection
      set((state) => ({
        selectedChat: state.selectedChat && state.selectedChat._id.toString() === groupId.toString() ? null : state.selectedChat,
      }));
      toast.success("Left group successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
    }
  },

  subscribeToMessages: () => {
    const { selectedChat, isGroupChat } = get();
    if (!selectedChat) return;

    const socket = useAuthStore.getState().socket;

    // Handle individual chat messages
    socket.on("newMessage", (newMessage) => {
      // Only process if we're in an individual chat
      if (isGroupChat) return;
      
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedChat._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });

    // Handle group chat messages
    socket.on("newGroupMessage", (newMessage) => {
      // Only process if we're in a group chat
      if (!isGroupChat) return;
      
      // Check if the message is for the currently selected group
      if (newMessage.groupId !== selectedChat._id) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });

    // Subscribe to message deletion events
    socket.on("messageDeleted", ({ messageId }) => {
      set({
        messages: get().messages.filter((message) => message._id !== messageId),
      });
    });

    // Subscribe to group updates
    socket.on("groupUpdated", (updatedGroup) => {
      // Update the group in the state
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id.toString() === updatedGroup._id.toString() ? updatedGroup : group
        ),
      }));
      
      // If this is the selected group, update it
      if (get().selectedChat && get().selectedChat._id.toString() === updatedGroup._id.toString()) {
        set({
          selectedChat: updatedGroup,
        });
      }
    });

    // Subscribe to removed from group events
    socket.on("removedFromGroup", (group) => {
      // Remove the group from the state
      set((state) => ({
        groups: state.groups.filter((g) => g._id.toString() !== group._id.toString()),
      }));
      
      // If this is the selected group, clear the selection
      if (get().selectedChat && get().selectedChat._id.toString() === group._id.toString()) {
        set({
          selectedChat: null,
        });
      }
    });
    
    // Subscribe to left group events
    socket.on("leftGroup", (group) => {
      // Remove the group from the state
      set((state) => ({
        groups: state.groups.filter((g) => g._id.toString() !== group._id.toString()),
      }));
      
      // If this is the selected group, clear the selection
      if (get().selectedChat && get().selectedChat._id.toString() === group._id.toString()) {
        set({
          selectedChat: null,
        });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("newGroupMessage");
    socket.off("messageDeleted");
    socket.off("groupUpdated");
    socket.off("removedFromGroup");
    socket.off("leftGroup");
  },

  setSelectedChat: (selectedChat, isGroup = false) => {
    set({ selectedChat, isGroupChat: isGroup });
  },
}));
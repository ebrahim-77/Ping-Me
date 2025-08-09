import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, members, profilePic } = req.body;
    const creatorId = req.user._id;

    // Validate that members array is provided and contains at least one member
    if (!members || members.length === 0) {
      return res.status(400).json({ error: "At least one member is required" });
    }

    // Add creator to members if not already included
    const memberIds = [...new Set([...members, creatorId.toString()])];

    // Validate that all members exist
    const validUsers = await User.find({ _id: { $in: memberIds } });
    if (validUsers.length !== memberIds.length) {
      return res.status(400).json({ error: "One or more members are invalid" });
    }

    // Prepare group data
    const groupData = {
      name,
      creator: creatorId,
      admins: [creatorId],
      members: memberIds,
    };

    // Handle profile picture if provided
    if (profilePic) {
      // Check if image is a valid base64 string
      if (!profilePic.startsWith("data:image/")) {
        return res.status(400).json({ error: "Invalid image format" });
      }

      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(profilePic, {
        folder: "chat_app/groups",
        transformation: [
          { width: 400, height: 400, crop: "limit", quality: "auto" },
        ],
      });
      
      groupData.profilePic = uploadResponse.secure_url;
    }

    const newGroup = new Group(groupData);

    await newGroup.save();

    // Populate the group with member details
    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members", "-password")
      .populate("admins", "-password")
      .populate("creator", "-password");

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.log("Error in createGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all groups for the logged-in user
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({ members: userId })
      .populate("members", "-password")
      .populate("admins", "-password")
      .populate("creator", "-password")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in getUserGroups controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add member to group
export const addMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is admin or creator
    const isAdmin = group.admins.some(
      (admin) => admin.toString() === userId.toString()
    );
    const isCreator = group.creator.toString() === userId.toString();
    if (!isAdmin && !isCreator) {
      return res
        .status(403)
        .json({ error: "Only admins or creator can add members" });
    }

    // Check if member already exists in group
    const isMember = group.members.some(
      (member) => member.toString() === memberId
    );
    if (isMember) {
      return res.status(400).json({ error: "Member already in group" });
    }

    // Validate that member exists
    const member = await User.findById(memberId);
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    group.members.push(memberId);
    await group.save();

    // Populate the updated group
    const populatedGroup = await Group.findById(groupId)
      .populate("members", "-password")
      .populate("admins", "-password")
      .populate("creator", "-password");

    // Notify all group members about the new member
    group.members.forEach((memberId) => {
      const memberSocketId = getReceiverSocketId(memberId);
      if (memberSocketId) {
        io.to(memberSocketId).emit("groupUpdated", populatedGroup);
      }
    });

    res.status(200).json(populatedGroup);
  } catch (error) {
    console.log("Error in addMember controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove member from group
export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is admin or creator
    const isAdmin = group.admins.some(
      (admin) => admin.toString() === userId.toString()
    );
    const isCreator = group.creator.toString() === userId.toString();
    if (!isAdmin && !isCreator) {
      return res
        .status(403)
        .json({ error: "Only admins or creator can remove members" });
    }

    // Prevent removing the creator
    if (memberId === group.creator.toString()) {
      return res.status(400).json({ error: "Cannot remove the group creator" });
    }

    // Prevent admins from removing other admins
    const isMemberAdmin = group.admins.some(
      (admin) => admin.toString() === memberId
    );
    if (isMemberAdmin && !isCreator) {
      return res
        .status(403)
        .json({ error: "Only the creator can remove other admins" });
    }

    // Check if member exists in group
    const isMember = group.members.some(
      (member) => member.toString() === memberId
    );
    if (!isMember) {
      return res.status(400).json({ error: "Member not in group" });
    }

    // Remove member from group
    group.members = group.members.filter(
      (member) => member.toString() !== memberId
    );

    // If the member was an admin, remove them from admins list
    group.admins = group.admins.filter(
      (admin) => admin.toString() !== memberId
    );

    await group.save();

    // Populate the updated group
    const populatedGroup = await Group.findById(groupId)
      .populate("members", "-password")
      .populate("admins", "-password")
      .populate("creator", "-password");

    // Notify all group members about the updated group
    group.members.forEach((memberId) => {
      const memberSocketId = getReceiverSocketId(memberId);
      if (memberSocketId) {
        io.to(memberSocketId).emit("groupUpdated", populatedGroup);
      }
    });

    // Notify the removed member
    const removedMemberSocketId = getReceiverSocketId(memberId);
    if (removedMemberSocketId) {
      io.to(removedMemberSocketId).emit("removedFromGroup", group);
    }

    res.status(200).json(populatedGroup);
  } catch (error) {
    console.log("Error in removeMember controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get group messages
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is a member of the group
    const isMember = group.members.some(
      (member) => member.toString() === userId.toString()
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

    const messages = await Message.find({ groupId })
      .populate("senderId", "-password")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send group message
export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is a member of the group
    const isMember = group.members.some(
      (member) => member.toString() === senderId.toString()
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

    let imageUrl;
    if (image) {
      // Check if image is a valid base64 string
      if (!image.startsWith("data:image/")) {
        return res.status(400).json({ error: "Invalid image format" });
      }

      // Upload base64 image to cloudinary with size optimization
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "chat_app/groups",
        transformation: [
          { width: 800, height: 600, crop: "limit", quality: "auto" },
        ],
      });
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      groupId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // Populate sender details
    await newMessage.populate("senderId", "-password");

    // Add message to group's messages array
    group.messages.push(newMessage._id);
    await group.save();

    // Emit socket event to all group members
    group.members.forEach((memberId) => {
      const memberSocketId = getReceiverSocketId(memberId);
      if (memberSocketId) {
        io.to(memberSocketId).emit("newGroupMessage", newMessage);
      }
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendGroupMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Leave group
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is a member of the group
    const isMember = group.members.some(
      (member) => member.toString() === userId.toString()
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

    // Prevent creator from leaving the group
    if (group.creator.toString() === userId.toString()) {
      return res.status(400).json({ error: "Creator cannot leave the group" });
    }

    // Remove user from members
    group.members = group.members.filter(
      (member) => member.toString() !== userId.toString()
    );

    // Remove user from admins if they were an admin
    group.admins = group.admins.filter(
      (admin) => admin.toString() !== userId.toString()
    );

    await group.save();

    // Populate the updated group
    const populatedGroup = await Group.findById(groupId)
      .populate("members", "-password")
      .populate("admins", "-password")
      .populate("creator", "-password");

    // Notify all group members about the updated group
    group.members.forEach((memberId) => {
      const memberSocketId = getReceiverSocketId(memberId);
      if (memberSocketId) {
        io.to(memberSocketId).emit("groupUpdated", populatedGroup);
      }
    });

    // Notify the user who left
    const userSocketId = getReceiverSocketId(userId);
    if (userSocketId) {
      io.to(userSocketId).emit("leftGroup", group);
    }

    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.log("Error in leaveGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update group (including profile picture)
export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;
    const { profilePic } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is admin or creator
    const isAdmin = group.admins.some(
      (admin) => admin.toString() === userId.toString()
    );
    const isCreator = group.creator.toString() === userId.toString();
    if (!isAdmin && !isCreator) {
      return res
        .status(403)
        .json({ error: "Only admins or creator can update group" });
    }

    let updatedFields = {};

    // Update group name if provided
    if (name) {
      updatedFields.name = name;
    }

    // Update profile picture if provided
    if (profilePic) {
      // Check if image is a valid base64 string
      if (!profilePic.startsWith("data:image/")) {
        return res.status(400).json({ error: "Invalid image format" });
      }

      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(profilePic, {
        folder: "chat_app/groups",
        transformation: [
          { width: 400, height: 400, crop: "limit", quality: "auto" },
        ],
      });
      
      updatedFields.profilePic = uploadResponse.secure_url;
    }

    // Update the group
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $set: updatedFields },
      { new: true }
    )
      .populate("members", "-password")
      .populate("admins", "-password")
      .populate("creator", "-password");

    // Notify all group members about the updated group
    group.members.forEach((memberId) => {
      const memberSocketId = getReceiverSocketId(memberId);
      if (memberSocketId) {
        io.to(memberSocketId).emit("groupUpdated", updatedGroup);
      }
    });

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in updateGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
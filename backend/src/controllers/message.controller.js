import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const myId = req.user._id;

    // Check if chatId is a group ID by trying to find a group with this ID
    const group = await Group.findById(chatId);
    
    if (group) {
      // It's a group, fetch group messages
      const messages = await Message.find({ groupId: chatId })
        .populate("senderId", "-password")
        .sort({ createdAt: 1 });
      
      return res.status(200).json(messages);
    } else {
      // It's a user-to-user chat
      const messages = await Message.find({
        $or: [
          { senderId: myId, receiverId: chatId },
          { senderId: chatId, receiverId: myId },
        ],
      });

      return res.status(200).json(messages);
    }
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Check if receiverId is a group ID
    const group = await Group.findById(receiverId);
    
    if (group) {
      // It's a group message
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
            { width: 800, height: 600, crop: "limit", quality: "auto" }
          ]
        });
        imageUrl = uploadResponse.secure_url;
      }

      const newMessage = new Message({
        senderId,
        groupId: receiverId,
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

      return res.status(201).json(newMessage);
    } else {
      // It's a user-to-user message
      let imageUrl;
      if (image) {
        // Check if image is a valid base64 string
        if (!image.startsWith("data:image/")) {
          return res.status(400).json({ error: "Invalid image format" });
        }
        
        // Upload base64 image to cloudinary with size optimization
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: "chat_app",
          transformation: [
            { width: 800, height: 600, crop: "limit", quality: "auto" }
          ]
        });
        imageUrl = uploadResponse.secure_url;
      }

      const newMessage = new Message({
        senderId,
        receiverId,
        text,
        image: imageUrl,
      });

      await newMessage.save();

      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }

      res.status(201).json(newMessage);
    }
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const senderId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if the user is the sender of the message
    if (message.senderId.toString() !== senderId.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    await Message.findByIdAndDelete(messageId);

    if (message.groupId) {
      // It's a group message
      // Emit socket event to all group members about the deleted message
      const group = await Group.findById(message.groupId);
      if (group) {
        group.members.forEach((memberId) => {
          const memberSocketId = getReceiverSocketId(memberId);
          if (memberSocketId) {
            io.to(memberSocketId).emit("messageDeleted", { messageId });
          }
        });
      }
    } else {
      // It's a user-to-user message
      // Emit socket event to notify receivers about the deleted message
      const receiverSocketId = getReceiverSocketId(message.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", { messageId });
      }

      // Emit socket event to notify sender about the deleted message
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDeleted", { messageId });
      }
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
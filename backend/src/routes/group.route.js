import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getUserGroups,
  addMember,
  removeMember,
  getGroupMessages,
  sendGroupMessage,
  leaveGroup,
  updateGroup,
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getUserGroups);
router.post("/add-member", protectRoute, addMember);
router.post("/remove-member", protectRoute, removeMember);
router.get("/messages/:groupId", protectRoute, getGroupMessages);
router.post("/send/:groupId", protectRoute, sendGroupMessage);
router.post("/leave/:groupId", protectRoute, leaveGroup);
router.put("/update/:groupId", protectRoute, updateGroup);

export default router;
import { Router } from "express";
import {
    getChannelStats,
    getChannelVideos
    } from "../controllers/dashbord.controllers.js"

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()
router.use(verifyJWT)

router.route("/status").get(getChannelStats)
router.route("/channel-videos").get(getChannelVideos)

export default router
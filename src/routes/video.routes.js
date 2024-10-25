import { Router } from "express"
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.conrollers.js"
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router()
router.route(verifyJWT)

router.route("/")
.get(getAllVideos)
.post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishAVideo
)

router.route("/v/:videoId")
.get(getVideoById)
.delete(deleteVideo)
.patch(upload.single("thumbnail"), updateVideo)

router.route("/toggle/p/:videoId").patch(togglePublishStatus)

export default router

import { Router } from "express"
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
    } from "../controllers/playlist.controllers.js"
import {verifyJWT} from "../middlewares/auth.middlewares.js"

const router = Router()
router.use(verifyJWT)

router.route("/create").post(createPlaylist)

router.route("/:playlistId")
.get(getPlaylistById)
.patch(updatePlaylist)
.delete(deletePlaylist)

router.route("/add-video/:videoId/:playlistId").post(addVideoToPlaylist)
router.route("/remove-video/:videoId/:playlistId").patch(removeVideoFromPlaylist)

router.route("/get-playlist/:userId").get(getUserPlaylists)

export default router



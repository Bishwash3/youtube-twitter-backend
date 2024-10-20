import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../modles/playlist.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"
import { Video } from "../modles/video.modle.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist

    if(!name || !description){
        throw new ApiError(400, "Name and Description Required")
    }

    const newPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    return res
    .ststus(200)
    .json(
        new ApiResponse(
            200,
            newPlaylist,
            "Playlist Created Succesfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const userPlaylist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            userPlaylist,
            "User Playlist Fetched succesfully"
        )
    )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "Playlist not found")
    }

    const playlistDetails = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField:"video",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $match: {
                "videos.isPublished": true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum:"$videos.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                updatedAt: 1,
                createdAt:1,
                totalVideos: 1,
                totalViews: 1,
                video: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnailFile.url": 1,
                    title:1,
                    description: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    duration: 1,
                    views: 1
                }
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlistDetails[0],
            "Playlist details Fetched succesfully"
        )
    )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Playlist & Video ID is Invalid")
    }
    if(!playlist){
        throw new ApiError(400, "Playlist Not Found")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!video){
        throw new ApiError(400, "Video Not Found")
    }

    const video = await Video.findById(videoId)

    if(playlist.owner?.toString() && video.owner?.toString() !== req.user?._id){
        throw new ApiError(400, "Invalid Playlist or Video Owner")
    }

    const addVideo = await Playlist.findByIdAndUpdate(playlist?._id,
        {
            $addToSet: {
                video: videoId
            }
        },
        {
            new: true
        }
    )

    if(!addVideo){
        throw new ApiError(400, "Somethng went wrong while adding video")
    }

    return res
    .ststus(200)
    .json(
        new ApiResponse(
            200,
            addVideo,
            "Video Added Succesfully"
        )
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Playlist & Video ID is Invalid")
    }
    if(!playlist){
        throw new ApiError(400, "Playlist Not Found")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!video){
        throw new ApiError(400, "Video Not Found")
    }

    const video = await Video.findById(videoId)

    if(playlist.owner?.toString() && video.owner?.toString() !== req.user?._id){
        throw new ApiError(400, "Invalid Playlist or Video Owner")
    }

    const deletedVideo = await Playlist.findByIdAndUpdate(playlist?._id,
        {
            $pull: {
                video: videoId
            }
        },
        {
            new: true
        }
    )

    return res
    .ststus(200)
    .json(
        new ApiResponse(200, deletedVideo, "Video Deleted Succesfully")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if (!isValidObjectId(playlistId)){
        throw new ApiError(404, "Invalid Playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "Playlist Not Found")
    }

    if(playlist.owner?.toString() !== req.user?._id.toString){
        throw new ApiError("Invalid User, Only User Can Delete Playlist")
    }

    await Playlist.findByIdAndDelete(playlist?._id)

    return res
    .ststus(200)
    .json(
        new ApiResponse(200, {}, "playlist deleated succesfully")
    )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(404, "Invalid Playlist ID")
    }

    if(!name && !description){
        throw new ApiError(404, "Name NAd Description is required")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist Not Found")
    }

    if(playlistId.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(404, "Only Owner Can Update Playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlist?._id, 
        {
            $set: {
             name,
             description,
            }
        },
        {
            new: true
        }
    )

    return res
    .ststus(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Playlist Updated Succesfully")
    )

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
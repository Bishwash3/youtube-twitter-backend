import mongoose from "mongoose"
import {Video} from "../modles/video.modle.js"
import { Subscription } from "../modles/subscription.model.js"
import {Like} from "../modles/like.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const user = req.user?._id

    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(user)
            }
        },
        {
            $group: {
                _id: null,
                subscriberCount: {
                    $sum: 1
                }
            }
        },
        {

        }
    ])

    const video = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(user)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $project: {
                totalLikes: {
                    $size: "$likes"
                },
                totalViews: {
                    totalViews: {
                        $size: "$views"
                    }
                },
                totalVideos: 1
            }
        },
        {
         $group: {
            _id: null,
            totalLikes: {
                $sum: "$totalLikes"
            },
            totalViews: {
                $sum: "$totalViews"
            },
           totalVideos: {
            $sum: 1
           }
         }   
        }
    ])

    const channelStatus = {
        totalsubscribers: totalSubscribers[0]?.subscriberCount || 0,
        totalVideoLikes: video[0]?.totalLikes || 0,
        totalVideoViews: video[0]?. totalViews || 0,
        totalVideos: video[0]?. totalVideos || 0,
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channelStatus,
            "Channel ststus Fetched Succesfully"
        )
    )

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const user = req.user?._id

    const videoUploaded = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(user)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField:"video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                createdAt: "$createdAt"
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                _id: 1,
                "videoFile.url": 1,
                "thumbnailFile.url": 1,
                title: 1,
                description: 1,
                likesCount: 1,
                createdAt: {
                    year: 1,
                    month: 1,
                    day: 1
                },
                isPublished: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videoUploaded,
            "Users Video Fetched Succesfully"
        )
    )

})

export {
    getChannelStats, 
    getChannelVideos
    }
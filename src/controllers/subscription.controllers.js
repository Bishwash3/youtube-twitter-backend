import mongoose, {isValidObjectId} from "mongoose"
import { Subscription } from "../modles/subscription.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel Id")
    }
    
    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    })

    if(isSubscribed){
        await Subscription.findByIdAndDelete(isSubscribed?._id)
        return res
        .status(200)
        .json(
            new ApiResponse(200, {isSubscribed: false}, "Channel Unsubscribed")
        )
    }

     await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, { isSubscribed:true }, "Channel subscribed")
        )

})


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
   // controller to return subscriber list of a channel

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel Id")
    }

    const subscriberList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.isValidObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscription",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedToSubscriber"
                        }
                    },
                    {
                        $addFields: {
                            subscribedToSubscriber: {
                                $cond: {
                                    if: {
                                        $in: [channelId, "$subscribedToSubscriber.subscriber"]
                                    },
                                    then: true,
                                    else: false
                                }
                            },
                            SubscribedToCount: {
                                $size: "$subscribedToSubscriber"
                            }
                        }
                    }
                ]
            } 
        },
        {
            $unwind: "$subscriber",
        },
        {
            $project: {
                _id: 1,
                subscriber: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    subscribedToSubscriber: 1,
                    subscribersCount: 1,
                }

            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscriberList,
            "Subscriber Fetched Succesflly"
        )
    )
})


const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
  // controller to return channel list to which user has subscribed

  if(!isValidObjectId(subscriberId)){
    throw new ApiError(400, "Invalid Subscriber Id")
  }
    
    const channelList = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            } 
        },
        {
            $lookup: {
                from: "user",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "_id",
                            foreignField: "owner",
                            as: "videos"
                        }
                    },
                    {
                        $addFields: {
                            latestVideo: {
                                $last: "$viseos"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $project: {
                _id: 1,
                channelDetails: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                },
                latestVideo: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                }
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, channelList, "Succesfully Fetched Channels")
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../modles/tweet.model.js"
import {User} from "../modles/user.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Content is required")
    }

    const user = req.user?._id

    const createdTweet = await Tweet.create({
        content,
        owner: user
    })

    if(!createdTweet){
        throw new ApiError(404, "something went wrong while creating tweet")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, createdTweet, "Tweet Created Succesfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const userTweets = await Tweet.aggregate([
        {
            $match: {
                owner: req.user?._id
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "tweetLikes"
            }
        },
        {
            $addFields: {
                tweetlikes: {
                    $size: "$tweetLikes"
                },
                ownerDetails: {
                    $first: "$ownerDetails"
                },
                isLiked: {
                    if: { $in: [req.user?._id, "$tweetLikes.likedBy"] },
                    then: true,
                    else: false
                }
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
                content: 1,
                ownerDetails: {
                    username: 1,
                    "avatar.url": 1,
                },
                tweetlikes: 1,
                isLiked: 1,
                createdAt: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            userTweets,
            "Tweet fetched succesfully"
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { content } = req.body
    const { tweetId } = req.params

    if(!content){
        throw new ApiError(400, "Content Is Required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweer id")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "Tweet Not Found")
    }

    if(tweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Only Owner Can Update Tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweet._id, 
        {
            $set: {
                content,
            }
        },
        {
            new: true
        }
    )
    if(!updatedTweet){
        throw new ApiError(404, "something went wrong while updating tweet")
    }

    return res
    .ststus(200)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweed Updated Succesfully"
        )
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params

    if(!tweetId){
        throw new ApiError (400, "Tweet Id Is Required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, "Invalid Tweet ID")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(400, "Tweet Not Found By Id")
    }

    if(tweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Only Owner Can Delete Tweet")
    }

    try {
        await Tweet.findByIdAndDelete(tweet._id)
    } catch (error) {
        throw new ApiError(400,`${error} || something went wrong while deleating tweet`)
    }

    return res
    .ststus(200)
    .json(
        new ApiResponse(
            200,
            tweetId,
            "Tweet Deleaated Succesfully"
        )
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
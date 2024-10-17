import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../modles/like.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }


    const likedAlready = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id,
    });

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);

        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }),"Video Liked removed succesfully");
    }

    await Like.create({
        video: videoId,
        likedBy: req.user?._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }), "Viseo Liked succesfully");
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }


    const likedAlready = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id,
    });

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);

        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }), "comment like removed succesfully");
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }), "comment liked succesfully");
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }


    const likedAlready = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);

        return res
            .status(200)
            .json(new ApiResponse(200, { tweetId, isLiked: false }), "Tweet like removed succesfully");
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }), "Tweet Likes succesfully");
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const likedVideoAggregate = await Like.aggregate([
    {
        $match: {
            likedBy: new mongoose.Types.ObjectId(req.user?._id)
        },
    },
    {
        $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "likedVideos",
            pipeline: [
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails"
                },
            },
            {
                $unwind: "$ownerDetais"
            },
            ]
        }
    },
    {
        $unwind: "$likedVideos"
    },
    {
        $sort: {
            createdAt: -1
        }
    },
    {
        $project: {
            _id: 0,
            likedVideo: {
                _id: 1,
                "videoFile.url": 1,
                "thumbnail.url": 1,
                owner: 1,
                title: 1,
                description: 1,
                views: 1,
                duration: 1,
                createdAt: 1,
                ownerDetails: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                },
            }
        }
    }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideoAggregate,
            "Liked videos fetched succesfully"
        )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
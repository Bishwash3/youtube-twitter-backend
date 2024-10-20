import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../modles/comment.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"
import {Video} from "../modles/video.modle.js"
import {Like} from "../modles/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    const allComments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "owner",
                as: "owner"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                likedComments: {
                    sizeOf: "$likes"
                },
                owner: {
                    $first : "$owner"
                },
                isLiked: {
                    $cond: {
                        $in: [req.user?._id, "$likes.likedBy"]
                    },
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
                content: 1,
                likedComments: 1,
                createdAt: 1,
                owner: {
                    fullName: 1,
                    username: 1,
                    "avatar.url": 1
                },
                isLiked: 1
            }
        }
    ])

    const options = {
        parseInt: (page, 10),
        parseInt: (limit, 10)
    }

    const comments = await Comment.aggregatePaginate(allComments,options);

    return res
    .satus(200)
    .json(
        new ApiResponse(200, comments, "comments fetched succesfully")
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const content = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }
    if(!content){
        throw new ApiError(404, "Content is Required")
    }

    const video = await Video.findById(videoId)

    const createComment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })
    if(!createComment){
        throw new ApiError(400, "Failed TO Comment on Video")
    }

    return res
    .satus(200)
    .json(
        new ApiResponse(200, createComment, "Comment Added Succesfully")
    )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const { content } = req.body

    if(!commentId){
        throw new ApiError(400, "Comment Id Not Found")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment Id")
    }

    const existingComment = await Comment.findById(commentId)

    if(!existingComment){
        throw new ApiError(400, "Previous Comment not found")
    }

    if(existingComment?.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Only Comment owner Can Edit Comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        {
            $set: {
                content,
                previousCommentContent: existingComment.content //store old comment here
            }
        },
         {new: true}
    )
    return res
    .status(200)
    .json(
        new ApiResponse(200, updateComment, "Comment Updated succesfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment ID")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(400, "Comment Not Found")
    }

    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Comment owner is not valid")
    }

    await Comment.findByIdAndDelete(commentId)

    await Like.deleteMany({
        comment: commentId,
        likedBy: req.user?._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, commentId, "Comment deleated succesfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
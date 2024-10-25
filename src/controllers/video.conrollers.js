import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../modles/video.modle.js"
import {User} from "../modles/user.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"
import {uploadOnCloudinary, deleteOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const piepline = []

    if(query){
        piepline.push({
            $search: {
                index: "search-video",
                text: {
                    query: query,
                    path: ["title", "description"]
                }
            }
        })
    }

    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(400, "Invalid user id")
        }

        piepline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    piepline.push({
        $match: {isPublished: true}
    })

    if(sortBy && sortType){
        piepline.push({
            $sort: {
                [sortBy]: sortType === "asc"? 1 :-1
            }
        })
    } else{
        piepline.push({
            $sort: {
                createdAt: -1
            }
        })
    }

    piepline.push(
    {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails",
            pipeline: [
                {
                    $project: {
                        username: 1,
                        "avatar.url": 1,
                    }
                }
            ]
        }
    },
    {
        $unwind: "$ownerDetails"
    }
    )

    const videoAggregate = await Video.aggregate(piepline)

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }
    
    const video = await Video.aggregatePaginate(videoAggregate, options)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video fetched succesfully"
        )
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title?.trim() && !description?.trim()){
        throw new ApiError(400, "Title And Description Is Required")
    }

    const videoFileLocalPath = req.files?.videoFile[0].path
    const thumbnailFileLocalPath = req.files?.thumbnail[0].path

    if(!videoFileLocalPath){
        throw new ApiError(400, "Video File Path Is Required")
    }

    if(!thumbnailFileLocalPath){
        throw new ApiError(400, "Thumbnail File Path Is Required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath)

    if(!videoFile){
        throw new ApiError(400, "Something went wrong while uploading video on cloudnary")
    }

    if(!thumbnail){
        throw new ApiError(400, "Something went wrong while uploading thumbnail on cloudnary")
    }

    const video = await Video.create({
        title,
        description,
        owner: req.user?._id,
        isPublished: false,
        duration: videoFile.duration,
        videoFile: {
            url: videoFile.url.toString(),
            public_id: videoFile.public_id.toString()
        },
        thumbnail: {
            url: thumbnail.url.toString(),
            public_id: thumbnail.public_id.toString()
        }
    })

    const uploadedFile = await Video.findById(video._id)

    if(!uploadedFile){
        throw new ApiError(404, "Video Upload Failed")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            uploadedFile,
            "Video uploaded succesfully"
        )
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video Id Invalid")
    }

    const videoById = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            totalSubscribers: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                               $cond: { if: {$in: [req.user?._id || null, "$subscribers.subscriber"]},
                                then: true,
                                else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1,
                            totalSubscribers: 1,
                            isSubscribed: 1,
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videoLikes"
            }
        },
        {
            $addFields: {
                totalLikes: {
                    $size: "$videoLikes"
                },
                isLiked: {
                    $cond: {
                    if: { $in: [req.user?._id || null, "$videoLikes.likedBy"]},
                    then: true,
                    else: false
                    }
                },
                owner: {
                    $first: "$ownerDetails"
                }
            }
        },
        {
            $lookup:{
            from: "comments",
            localField: "_id",
            foreignField: "video",
            as: "comment",
            pipeline: [
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "commentOwner"
                    }
                },
                {
                    $project: {
                        username: 1,
                        "avatar.url": 1,
                    }
                }
            ]
            } 
        },
        {
            $project: {
                _id: 1,
                "videoFile.url": 1,
                "thumbnail.url": 1,
                title: 1,
                description: 1,
                views: 1,
                duration: 1,
                owner: 1,
                totalLikes: 1,
                isLiked: 1,
                comment: {
                    content: 1,
                    commentOwner: 1
                }
            }
        }
    ])

    if (!videoById || videoById.length === 0) {
        throw new ApiError(400, "Video Not Found");
    }

    const video = videoById[0];

        // increment views if video fetched successfully
        await Video.findByIdAndUpdate(videoId, {
            $inc: {
                views: 1
            }
        })
    
        // add this video to user watch history
        await User.findByIdAndUpdate(req.user?._id, {
            $addToSet: {
                watchHistory: videoId
            }
        })
    

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video Fetched Succesfully"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title, description} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    if(!title && !description){
        throw new ApiError(400, "Title and Description Is Required")
    }
    
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video Not Found")
    }

    if(video.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Only Owner Can Update Video")
    }

    const thumbnailToDelede = video.public_id
    const thumbnailLocalPath = req.files?.path

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail){
        throw new ApiError(400, "thumbnail not found")
    }

    const updatedVideo = await Video.findByIdAndUpdate(video._id, {
        $set: {
            title,
            description,
            thumbnail: {
                url: thumbnail.url,
                public_id: thumbnail.public_id
            }
        }
    },
    {
        new: true
    }
)

    if(updateVideo){
        await deleteOnCloudinary(thumbnailToDelede)

    }else{
        throw new ApiError(400,"Something went wrong while updating video")

    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Succesfully updated video")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }
    
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video Not Found")
    }

    if(video.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Only Owner Can Update Video")
    }

   const deleatedVideo = await Video.findByIdAndDelete(video._id)

   if(!deleatedVideo){
    throw new ApiError(400, "something went wrong while deleating video")
   }

   await deleteOnCloudinary(video.thumbnail.public_id)
   await deleteOnCloudinary(video.videoFile.public_id,"video")

   await Like.deleteMany(
    {
    video: videoId
    }
   )

   await Comment.deleteMany({
    video: videoId,
   })

   return res
   .status(200)
   .json(
    new ApiResponse(200, videoId, "Video deleated Succesfully")
   )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }
    
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video Not Found")
    }

    if(video.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Only Owner Can Update Video")
    }

    const toggleStatus = await Video.findByIdAndUpdate(videoId, {
            $set: {
             isPublished: !video.isPublished
            }
        },
        { new: true }
    )

    if(!toggleStatus){
        throw new ApiError(400, "Failed to toggle Published Ststus")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {isPublished: toggleStatus.isPublished},
            "Published Stats toggld succesfully"
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
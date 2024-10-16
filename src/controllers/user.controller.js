import {asyncHandler} from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiErrors.js"
import {User} from "../modles/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async(userId) => {
    try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false})

    return {accessToken, refreshToken}

        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async (req,res) =>{
     const {fullName , username , email ,password} = req.body

    if (
        [fullName ,email ,password ,username].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400 , "All fields are required")
     }

     const existedUser = await User.findOne({
        $or:[{ username }, { email }]
     })
     
     if (existedUser){
        throw new ApiError(409, "User already Exists")
     }

     const avatarLocalPath = req.files?.avatar[0]?.path;
    //  const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

     if( !avatarLocalPath){
        throw new ApiError(400 , "Avatar Image is Required")
     }

     const avatar = await uploadOnCloudinary(avatarLocalPath)
     const coverImage = await uploadOnCloudinary(coverImageLocalPath)

     if(!avatar){
        throw new ApiError(400 , "Avatar Image is Required")
     }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
     })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500 ,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Succesfully")
    )
})

const loginUser = asyncHandler( async(req, res) =>{
    const {email , username , password} = req.body


    if(!username && !email){
        throw new ApiError(400 , "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if (!user){
        throw new ApiError(404, "User Not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User Logged In Succesfully"
        )
    )


})

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    try {
        if(!incomingRefreshToken){
            throw new ApiError(401 , "Unauthorized Access")
        }
    
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh Token Is Expired")
        }
    
        const {accessToken , newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        const options = {
            httpOnly : true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token refreshed Successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
        
    }

})

const changeCurrentPassword = asyncHandler(async (req,res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password Changed Succesfully")
    )
})

const getCurrentUser = asyncHandler(async (req,res) => {
    return res 
    .status(200)
    .json( new ApiResponse(
        200,
         req.user,
         "User fetched succesfully")
    )
})

const updateAccountDetails = asyncHandler(async (req,res) => {
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "All fields are reuired")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res 
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account Details Updated succesfully"
        )
    )
})

const updateUserAvatar = asyncHandler(async (req,res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw ApiError(400, "Avatar file is missing")
    }

    const user = User.findById(req.user?._id)
    
    if(!user){
        throw new ApiError("404","User not found")
    }

    const previousAvatar = user.avatar
    
    const  avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error While upoading on cloudinary")
    }

    // If avatar exists before delete avatar
    if(previousAvatar){
        const avatarId = extractPublicIdfromUrl(previousAvatar)
        await deleteFromCloudinary(avatarId)
    }

    // Update user avatar
    const UpdatedUserAvatar = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,UpdatedUserAvatar,"Avatar Updated Successfully")
    )

})

const updateUserCoverImage = asyncHandler(async (req,res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw ApiError(400, "Cover Image file is missing")
    }

    const user =User.findById(req.user?._id)

    if(!user){
        throw new ApiError(400, "User Not Found")
    }

    const previousCoverImage = user.coverImage

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading Cover Image on cloudnary")
    }

    if(previousCoverImage){
        const coverImageId = extractPublicIdfromUrl(previousCoverImage)
        await deleteFromCloudinary(coverImageId)
    }

    const updatedCoverImage = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedCoverImage,"Cover Image Updated Successfully")
    )

})

const getUserProfile = asyncHandler(async (req,res) => {
    const {username} = req.params

    if (!username?.trim()){
        throw new ApiError(400, "Username Is Missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
         $lookup:{
            from: "subscription",
            localField: "_id",
            foreignField: "channel",
            as: "subscriber"
         }   
        },
        {
            $lookup:{
                from: "subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
             } 
        },
        {
            $addFields:{
                subscriberCount: {
                $size: "$subscriber"
            },
            channelsSubscribedToCount:{
                $size: "$subscribedTo"
            },
            isSubscribed: {
                $cond: {
                    if: {$in: [req.user?._id,"$subscriber.subscribedTo"]},
                    then: true,
                    else: false
                }
            }
        },
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel Not Found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0], "User channel fetched succesfully")
    )

})

const getWatchHistory = asyncHandler(async (req,res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "video",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "user",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "WatchHistory Fetched Succesfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserProfile,
    getWatchHistory
}
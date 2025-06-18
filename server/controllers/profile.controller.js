const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const Token = require("../models/token.model");
const Post = require("../models/post.model");
const Community = require("../models/community.model");
const UserPreference = require("../models/preference.model");
const formatCreatedAt = require("../utils/timeConverter");
const { verifyContextData, types } = require("./auth.controller");
const { saveLogInfo } = require("../middlewares/logger/logInfo");
const duration = require("dayjs/plugin/duration");
const dayjs = require("dayjs");
const mongoose = require("mongoose");
const Relationship = require("../models/relationship.model");

dayjs.extend(duration);

const LOG_TYPE = {
  SIGN_IN: "sign in",
  LOGOUT: "logout",
};

const LEVEL = {
  INFO: "info",
  ERROR: "error",
  WARN: "warn",
};

const MESSAGE = {
  SIGN_IN_ATTEMPT: "User attempting to sign in",
  SIGN_IN_ERROR: "Error occurred while signing in user: ",
  INCORRECT_EMAIL: "Incorrect email",
  INCORRECT_PASSWORD: "Incorrect password",
  DEVICE_BLOCKED: "Sign in attempt from blocked device",
  CONTEXT_DATA_VERIFY_ERROR: "Context data verification failed",
  MULTIPLE_ATTEMPT_WITHOUT_VERIFY:
    "Multiple sign in attempts detected without verifying identity.",
  LOGOUT_SUCCESS: "User has logged out successfully",
};

const signin = async (req, res, next) => {
  await saveLogInfo(req, MESSAGE.SIGN_IN_ATTEMPT, LOG_TYPE.SIGN_IN, LEVEL.INFO);

  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email: { $eq: email } });
    if (!existingUser) {
      await saveLogInfo(
        req,
        MESSAGE.INCORRECT_EMAIL,
        LOG_TYPE.SIGN_IN,
        LEVEL.ERROR
      );
      return res.status(404).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect) {
      await saveLogInfo(
        req,
        MESSAGE.INCORRECT_PASSWORD,
        LOG_TYPE.SIGN_IN,
        LEVEL.ERROR
      );
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isContextAuthEnabled = await UserPreference.findOne({
      user: existingUser._id,
      enableContextBasedAuth: true,
    });

    if (isContextAuthEnabled) {
      const contextDataResult = await verifyContextData(req, existingUser);

      if (contextDataResult === types.BLOCKED) {
        await saveLogInfo(
          req,
          MESSAGE.DEVICE_BLOCKED,
          LOG_TYPE.SIGN_IN,
          LEVEL.WARN
        );
        return res.status(401).json({
          message:
            "You've been blocked due to suspicious login activity. Please contact support for assistance.",
        });
      }

      if (
        contextDataResult === types.NO_CONTEXT_DATA ||
        contextDataResult === types.ERROR
      ) {
        await saveLogInfo(
          req,
          MESSAGE.CONTEXT_DATA_VERIFY_ERROR,
          LOG_TYPE.SIGN_IN,
          LEVEL.ERROR
        );
        return res.status(500).json({
          message: "Error occurred while verifying context data",
        });
      }

      if (contextDataResult === types.SUSPICIOUS) {
        await saveLogInfo(
          req,
          MESSAGE.MULTIPLE_ATTEMPT_WITHOUT_VERIFY,
          LOG_TYPE.SIGN_IN,
          LEVEL.WARN
        );
        return res.status(401).json({
          message:
            "You've temporarily been blocked due to suspicious login activity. We have already sent a verification email to your registered email address. " +
            "Please follow the instructions in the email to verify your identity and gain access to your account. " +
            "Please note that repeated attempts to log in without verifying your identity will result in this device being permanently blocked from accessing your account. " +
            "Thank you for your cooperation",
        });
      }

      if (contextDataResult.mismatchedProps) {
        const mismatchedProps = contextDataResult.mismatchedProps;
        const currentContextData = contextDataResult.currentContextData;
        if (
          mismatchedProps.some((prop) =>
            [
              "ip",
              "country",
              "city",
              "device",
              "deviceType",
              "os",
              "platform",
              "browser",
            ].includes(prop)
          )
        ) {
          req.mismatchedProps = mismatchedProps;
          req.currentContextData = currentContextData;
          req.user = existingUser;
          return next();
        }
      }
    }

    const payload = {
      id: existingUser._id,
      email: existingUser.email,
    };

    const accessToken = jwt.sign(payload, process.env.SECRET, {
      expiresIn: "6h",
    });

    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET, {
      expiresIn: "7d",
    });

    const newRefreshToken = new Token({
      user: existingUser._id,
      refreshToken,
      accessToken,
    });
    await newRefreshToken.save();

    res.status(200).json({
      accessToken,
      refreshToken,
      accessTokenUpdatedAt: new Date().toLocaleString(),
      user: {
        _id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        avatar: existingUser.avatar,
        userType: existingUser.userType,
        university: existingUser.university,
        currentCompany: existingUser.currentCompany,
      },
    });
  } catch (err) {
    await saveLogInfo(
      req,
      MESSAGE.SIGN_IN_ERROR + err.message,
      LOG_TYPE.SIGN_IN,
      LEVEL.ERROR
    );
    res.status(500).json({ message: "Something went wrong" });
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();

    const totalPosts = await Post.countDocuments({ user: user._id });

    const communities = await Community.find({ members: user._id });
    const totalCommunities = communities.length;

    const postCommunities = await Post.find({ user: user._id }).distinct(
      "community"
    );
    const totalPostCommunities = postCommunities.length;

    const createdAt = dayjs(user.createdAt);
    const now = dayjs();
    const durationObj = dayjs.duration(now.diff(createdAt));
    const durationMinutes = durationObj.asMinutes();
    const durationHours = durationObj.asHours();
    const durationDays = durationObj.asDays();

    user.duration = "";
    if (durationMinutes < 60) {
      user.duration = `${Math.floor(durationMinutes)} minutes`;
    } else if (durationHours < 24) {
      user.duration = `${Math.floor(durationHours)} hours`;
    } else if (durationDays < 365) {
      user.duration = `${Math.floor(durationDays)} days`;
    } else {
      const durationYears = Math.floor(durationDays / 365);
      user.duration = `${durationYears} years`;
    }

    const posts = await Post.find({ user: user._id })
      .populate("community", "name members")
      .limit(20)
      .lean()
      .sort({ createdAt: -1 });

    user.posts = posts.map((post) => ({
      ...post,
      isMember: post.community?.members
        .map((member) => member.toString())
        .includes(user._id.toString()),
      createdAt: formatCreatedAt(post.createdAt),
    }));

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

const addUser = async (req, res, next) => {
  try {
    // Log request body for debugging
    console.log("Request body:", req.body);

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const isConsentGiven = JSON.parse(req.body.isConsentGiven);

    const defaultAvatar =
      "https://raw.githubusercontent.com/nz-m/public-files/main/dp.jpg";
    const fileUrl = req.files?.[0]?.filename
      ? `${req.protocol}://${req.get("host")}/assets/userAvatars/${
          req.files[0].filename
        }`
      : defaultAvatar;

    const emailDomain = req.body.email.split("@")[1];
    const role = emailDomain === "mod.socialecho.com" ? "moderator" : "general";

    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      role: role,
      avatar: fileUrl,
      userType: req.body.userType,
      currentCompany: req.body.currentCompany || "",
      university: req.body.university || "",
    });

    await newUser.save();
    if (newUser.isNew) {
      throw new Error("Failed to add user");
    }

    // Log saved user for debugging
    console.log("Saved user:", newUser);

    if (isConsentGiven === false) {
      res.status(201).json({ message: "User added successfully" });
    } else {
      next();
    }
  } catch (err) {
    console.error("Error adding user:", err.message);
    res.status(400).json({ message: "Failed to add user", error: err.message });
  }
};

const logout = async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1] ?? null;
    if (accessToken) {
      await Token.deleteOne({ accessToken });
      await saveLogInfo(
        null,
        MESSAGE.LOGOUT_SUCCESS,
        LOG_TYPE.LOGOUT,
        LEVEL.INFO
      );
    }
    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    await saveLogInfo(null, err.message, LOG_TYPE.LOGOUT, LEVEL.ERROR);
    res.status(500).json({
      message: "Internal server error. Please try again later.",
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const existingToken = await Token.findOne({
      refreshToken: { $eq: refreshToken },
    });
    if (!existingToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const existingUser = await User.findById(existingToken.user);
    if (!existingUser) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const refreshTokenExpiresAt =
      jwt.decode(existingToken.refreshToken).exp * 1000;
    if (Date.now() >= refreshTokenExpiresAt) {
      await existingToken.deleteOne();
      return res.status(401).json({ message: "Expired refresh token" });
    }

    const payload = {
      id: existingUser._id,
      email: existingUser.email,
    };

    const accessToken = jwt.sign(payload, process.env.SECRET, {
      expiresIn: "6h",
    });

    res.status(200).json({
      accessToken,
      refreshToken: existingToken.refreshToken,
      accessTokenUpdatedAt: new Date().toLocaleString(),
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getModProfile = async (req, res) => {
  try {
    const moderator = await User.findById(req.userId);
    if (!moderator) {
      return res.status(404).json({ message: "User not found" });
    }

    const moderatorInfo = { ...moderator._doc };
    delete moderatorInfo.password;
    moderatorInfo.createdAt = moderatorInfo.createdAt.toLocaleString();

    res.status(200).json({ moderatorInfo });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateInfo = async (req, res) => {
  try {
    const userId = req.params.id;

    console.log("Updating user with ID:", userId);
    console.log("Request body:", req.body);

    const allowedFields = [
      "location",
      "interests",
      "bio",
      "currentCompany",
      "university",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field] || "";
      }
    }

    console.log("Updates to apply:", updates);

    if (Object.keys(updates).length === 0) {
      console.log("No valid fields provided for update");
      return res.status(400).json({
        message: "No valid fields provided for update",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true, select: "-password" }
    );

    if (!updatedUser) {
      console.log("User not found for ID:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User updated successfully:", updatedUser);

    res.status(200).json({
      message: "User info updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        location: updatedUser.location,
        interests: updatedUser.interests,
        bio: updatedUser.bio,
        currentCompany: updatedUser.currentCompany,
        university: updatedUser.university,
        avatar: updatedUser.avatar,
        userType: updatedUser.userType,
      },
    });
  } catch (err) {
    console.error("Error updating user info:", err.message);
    res.status(500).json({
      message: "Error updating user info",
      error: err.message,
    });
  }
};

const getPublicUsers = async (req, res) => {
  try {
    const userId = req.userId;

    const followingIds = await Relationship.find({
      follower: userId,
    }).distinct("following");

    const userIdObj = mongoose.Types.ObjectId(userId);
    const excludedIds = [...followingIds, userIdObj];

    const usersToDisplay = await User.aggregate([
      {
        $match: {
          _id: { $nin: excludedIds },
          role: { $ne: "moderator" },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          avatar: 1,
          location: 1,
          userType: 1,
        },
      },
      {
        $lookup: {
          from: "relationships",
          localField: "_id",
          foreignField: "following",
          as: "followers",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          avatar: 1,
          location: 1,
          userType: 1,
          followerCount: { $size: "$followers" },
        },
      },
      {
        $sort: { followerCount: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    res.status(200).json(usersToDisplay);
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

const getPublicUser = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const id = req.params.id;

    const user = await User.findById(id).select(
      "-password -email -savedPosts -updatedAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const totalPosts = await Post.countDocuments({ user: user._id });
    const communities = await Community.find({ members: user._id })
      .select("name")
      .lean();

    const currentUserCommunities = await Community.find({
      members: currentUserId,
    })
      .select("_id name")
      .lean();

    const userCommunities = await Community.find({ members: user._id })
      .select("_id name")
      .lean();

    const commonCommunities = currentUserCommunities.filter((comm) =>
      userCommunities.some((userComm) => userComm._id.equals(comm._id))
    );

    const isFollowing = await Relationship.findOne({
      follower: currentUserId,
      following: user._id,
    });

    const followingSince = isFollowing
      ? dayjs(isFollowing.createdAt).format("MMM D, YYYY")
      : null;

    const last30Days = dayjs().subtract(30, "day").toDate();
    const postsLast30Days = await Post.aggregate([
      { $match: { user: user._id, createdAt: { $gte: last30Days } } },
      { $count: "total" },
    ]);

    const totalPostsLast30Days =
      postsLast30Days.length > 0 ? postsLast30Days[0].total : 0;

    const responseData = {
      name: user.name,
      avatar: user.avatar,
      location: user.location,
      bio: user.bio,
      role: user.role,
      interests: user.interests,
      userType: user.userType,
      totalPosts,
      communities,
      totalCommunities: communities.length,
      joinedOn: dayjs(user.createdAt).format("MMM D, YYYY"),
      totalFollowers: user.followers?.length,
      totalFollowing: user.following?.length,
      isFollowing: !!isFollowing,
      followingSince,
      postsLast30Days: totalPostsLast30Days,
      commonCommunities,
      currentCompany: user.currentCompany,
      university: user.university,
    };

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({
      message: "Some error occurred while retrieving the user",
    });
  }
};

const followUser = async (req, res) => {
  try {
    const followerId = req.userId;
    const followingId = req.params.id;

    const relationshipExists = await Relationship.exists({
      follower: followerId,
      following: followingId,
    });

    if (relationshipExists) {
      return res.status(400).json({ message: "Already following this user" });
    }

    await Promise.all([
      User.findByIdAndUpdate(
        followingId,
        { $addToSet: { followers: followerId } },
        { new: true }
      ),
      User.findByIdAndUpdate(
        followerId,
        { $addToSet: { following: followingId } },
        { new: true }
      ),
    ]);

    await Relationship.create({ follower: followerId, following: followingId });

    res.status(200).json({ message: "User followed successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Some error occurred while following the user",
    });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const followerId = req.userId;
    const followingId = req.params.id;

    const relationshipExists = await Relationship.exists({
      follower: followerId,
      following: followingId,
    });

    if (!relationshipExists) {
      return res.status(400).json({ message: "Relationship does not exist" });
    }
    await Promise.all([
      User.findByIdAndUpdate(
        followingId,
        { $pull: { followers: followerId } },
        { new: true }
      ),
      User.findByIdAndUpdate(
        followerId,
        { $pull: { following: followingId } },
        { new: true }
      ),
    ]);

    await Relationship.deleteOne({
      follower: followerId,
      following: followingId,
    });

    res.status(200).json({ message: "User unfollowed successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Some error occurred while unfollowing the user",
    });
  }
};

const getFollowingUsers = async (req, res) => {
  try {
    const relationships = await Relationship.find({
      follower: req.userId,
    })
      .populate("following", "_id name avatar location userType")
      .lean();

    const followingUsers = relationships
      .map((relationship) => ({
        ...relationship.following,
        userType: relationship.following.userType,
        followingSince: relationship.createdAt,
      }))
      .sort((a, b) => b.followingSince - a.followingSince);

    res.status(200).json(followingUsers);
  } catch (error) {
    res.status(500).json({
      message: "Some error occurred while retrieving the following users",
    });
  }
};

module.exports = {
  addUser,
  signin,
  logout,
  refreshToken,
  getModProfile,
  getUser,
  updateInfo,
  getPublicUsers,
  getPublicUser,
  followUser,
  unfollowUser,
  getFollowingUsers,
};

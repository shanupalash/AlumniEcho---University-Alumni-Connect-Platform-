const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
const { ObjectId } = require("mongoose").Types;
dayjs.extend(relativeTime);
const formatCreatedAt = require("../utils/timeConverter");

const Post = require("../models/post.model");
const Community = require("../models/community.model");
const Comment = require("../models/comment.model");
const User = require("../models/user.model");
const Relationship = require("../models/relationship.model");
const Report = require("../models/report.model");
const PendingPost = require("../models/pendingPost.model");
const fs = require("fs");

const createPost = async (req, res) => {
  try {
    const { communityId, content } = req.body;
    const { userId, file, fileUrl, fileType } = req;

    console.log("Request body:", req.body);
    console.log("Request userId, file, fileUrl, fileType:", {
      userId,
      file,
      fileUrl,
      fileType,
    });

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Authentication failed: Missing user ID" });
    }

    if (!communityId || !content) {
      return res
        .status(400)
        .json({ message: "communityId and content are required" });
    }

    if (!ObjectId.isValid(userId) || !ObjectId.isValid(communityId)) {
      return res.status(400).json({ message: "Invalid user or community ID" });
    }

    const community = await Community.findOne({
      _id: communityId,
      members: userId,
    });

    console.log("Community found:", community);

    if (!community) {
      if (file) {
        const filePath = `./assets/userFiles/${file.filename}`;
        fs.unlink(filePath, (err) => {
          if (err) console.error(`Error deleting file: ${err.message}`);
        });
      }
      return res.status(401).json({
        message: `You are not a member of the community with ID ${communityId}. Please join the community to post.`,
      });
    }

    const newPost = new Post({
      user: userId,
      community: communityId,
      content,
      fileUrl: fileUrl || null,
      fileType: fileType || null,
    });

    const savedPost = await newPost.save();
    const postId = savedPost._id;

    const post = await Post.findById(postId)
      .populate("user", "name avatar")
      .populate("community", "name")
      .lean();

    post.createdAt = dayjs(post.createdAt).fromNow();

    res.json(post);
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      message: `Failed to create post: ${error.message}`,
    });
  }
};

const confirmPost = async (req, res) => {
  try {
    const { confirmationToken } = req.params;
    const userId = req.userId;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const pendingPost = await PendingPost.findOne({
      confirmationToken: { $eq: confirmationToken },
      status: "pending",
      user: userId,
    });

    if (!pendingPost) {
      return res
        .status(404)
        .json({ message: "Pending post not found or already processed" });
    }

    const { user, community, content, fileUrl, fileType } = pendingPost;
    const newPost = new Post({
      user,
      community,
      content,
      fileUrl,
      fileType,
    });

    await PendingPost.findOneAndDelete({
      confirmationToken: { $eq: confirmationToken },
    });
    const savedPost = await newPost.save();
    const postId = savedPost._id;

    const post = await Post.findById(postId)
      .populate("user", "name avatar")
      .populate("community", "name")
      .lean();

    post.createdAt = dayjs(post.createdAt).fromNow();

    res.json(post);
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      message: `Failed to confirm post: ${error.message}`,
    });
  }
};

const rejectPost = async (req, res) => {
  try {
    const { confirmationToken } = req.params;
    const userId = req.userId;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const pendingPost = await PendingPost.findOne({
      confirmationToken: { $eq: confirmationToken },
      status: "pending",
      user: userId,
    });

    if (!pendingPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    await pendingPost.remove();
    res.status(201).json({ message: "Post rejected" });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      message: `Error rejecting post: ${error.message}`,
    });
  }
};

const clearPendingPosts = async (req, res) => {
  try {
    const userId = req.userId;
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (user.role !== "moderator") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const date = new Date();
    date.setHours(date.getHours() - 1);

    await PendingPost.deleteMany({ createdAt: { $lte: date } });

    res.status(200).json({ message: "Pending posts cleared" });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      message: `Error clearing pending posts: ${error.message}`,
    });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;

    if (!ObjectId.isValid(postId) || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid post or user ID" });
    }

    const post = await findPostById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comments = await findCommentsByPostId(postId);

    post.comments = formatComments(comments);
    post.dateTime = formatCreatedAt(post.createdAt);
    post.createdAt = dayjs(post.createdAt).fromNow();
    post.savedByCount = await countSavedPosts(postId);

    const report = await findReportByPostAndUser(postId, userId);
    post.isReported = !!report;

    res.status(200).json(post);
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      message: `Error getting post: ${error.message}`,
    });
  }
};

const findPostById = async (postId) =>
  await Post.findById(postId)
    .populate("user", "name avatar")
    .populate("community", "name")
    .lean();

const findCommentsByPostId = async (postId) =>
  await Comment.find({ post: postId })
    .sort({ createdAt: -1 })
    .populate("user", "name avatar")
    .lean();

const formatComments = (comments) =>
  comments.map((comment) => ({
    ...comment,
    createdAt: dayjs(comment.createdAt).fromNow(),
  }));

const countSavedPosts = async (postId) =>
  await User.countDocuments({ savedPosts: postId });

const findReportByPostAndUser = async (postId, userId) =>
  await Report.findOne({ post: postId, reportedBy: userId });

const getPosts = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 10, skip = 0 } = req.query;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const communities = await Community.find({
      members: userId,
    });

    const communityIds = communities.map((community) => community._id);

    const posts = await Post.find({
      community: {
        $in: communityIds,
      },
    })
      .sort({
        createdAt: -1,
      })
      .populate("user", "name avatar")
      .populate("community", "name")
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    const formattedPosts = posts.map((post) => ({
      ...post,
      createdAt: dayjs(post.createdAt).fromNow(),
    }));

    const totalPosts = await Post.countDocuments({
      community: {
        $in: communityIds,
      },
    });

    res.status(200).json({
      formattedPosts,
      totalPosts,
    });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      message: `Error retrieving posts: ${error.message}`,
    });
  }
};

const getCommunityPosts = async (req, res) => {
  try {
    const communityId = req.params.communityId;
    const userId = req.userId;
    const { limit = 10, skip = 0 } = req.query;

    if (!ObjectId.isValid(communityId) || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid community or user ID" });
    }

    const isMember = await Community.findOne({
      _id: communityId,
      members: userId,
    });

    if (!isMember) {
      return res.status(401).json({
        message: "Unauthorized to view posts in this community",
      });
    }

    const posts = await Post.find({
      community: communityId,
    })
      .sort({
        createdAt: -1,
      })
      .populate("user", "name avatar")
      .populate("community", "name")
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    const formattedPosts = posts.map((post) => ({
      ...post,
      createdAt: dayjs(post.createdAt).fromNow(),
    }));

    const totalCommunityPosts = await Post.countDocuments({
      community: communityId,
    });

    res.status(200).json({
      formattedPosts,
      totalCommunityPosts,
    });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      message: `Error retrieving posts: ${error.message}`,
    });
  }
};

const getFollowingUsersPosts = async (req, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.userId;

    if (!ObjectId.isValid(communityId) || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid community or user ID" });
    }

    const following = await Relationship.find({
      follower: userId,
    });

    const followingIds = following.map(
      (relationship) => relationship.following
    );

    const posts = await Post.find({
      user: {
        $in: followingIds,
      },
      community: communityId,
    })
      .sort({
        createdAt: -1,
      })
      .populate("user", "name avatar")
      .populate("community", "name")
      .limit(20)
      .lean();

    const formattedPosts = posts.map((post) => ({
      ...post,
      createdAt: dayjs(post.createdAt).fromNow(),
    }));

    res.status(200).json(formattedPosts);
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      message: `Server error: ${error.message}`,
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found. It may have been deleted already",
      });
    }

    await post.remove();
    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      message: `An error occurred while deleting the post: ${error.message}`,
    });
  }
};

const populatePost = async (post) => {
  const savedByCount = await User.countDocuments({
    savedPosts: post._id,
  });

  return {
    ...post.toObject(),
    createdAt: dayjs(post.createdAt).fromNow(),
    savedByCount,
  };
};

const likePost = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.userId;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid post or user ID" });
    }

    const updatedPost = await Post.findOneAndUpdate(
      {
        _id: id,
        likes: {
          $ne: userId,
        },
      },
      {
        $addToSet: {
          likes: userId,
        },
      },
      {
        new: true,
      }
    )
      .populate("user", "name avatar")
      .populate("community", "name");

    if (!updatedPost) {
      return res.status(404).json({
        message: "Post not found. It may have been deleted already",
      });
    }

    const formattedPost = await populatePost(updatedPost);

    res.status(200).json(formattedPost);
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      message: `Error liking post: ${error.message}`,
    });
  }
};

const unlikePost = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.userId;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid post or user ID" });
    }

    const updatedPost = await Post.findOneAndUpdate(
      {
        _id: id,
        likes: userId,
      },
      {
        $pull: {
          likes: userId,
        },
      },
      {
        new: true,
      }
    )
      .populate("user", "name avatar")
      .populate("community", "name");

    if (!updatedPost) {
      return res.status(404).json({
        message: "Post not found. It may have been deleted already",
      });
    }

    const formattedPost = await populatePost(updatedPost);

    res.status(200).json(formattedPost);
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      message: `Error unliking post: ${error.message}`,
    });
  }
};

const addComment = async (req, res) => {
  try {
    const { content, postId } = req.body;
    const userId = req.userId;

    if (!ObjectId.isValid(postId) || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid post or user ID" });
    }

    if (!content) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const newComment = new Comment({
      user: userId,
      post: postId,
      content,
    });
    await newComment.save();
    await Post.findOneAndUpdate(
      {
        _id: postId,
      },
      {
        $addToSet: {
          comments: newComment._id,
        },
      }
    );
    res.status(200).json({
      message: "Comment added successfully",
    });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      message: `Error adding comment: ${error.message}`,
    });
  }
};

const savePost = async (req, res) => {
  await saveOrUnsavePost(req, res, "$addToSet");
};

const unsavePost = async (req, res) => {
  await saveOrUnsavePost(req, res, "$pull");
};

const saveOrUnsavePost = async (req, res, operation) => {
  try {
    const id = req.params.id;
    const userId = req.userId;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid post or user ID" });
    }

    const update = {};
    update[operation === "$addToSet" ? "$addToSet" : "$pull"] = {
      savedPosts: id,
    };
    const updatedUserPost = await User.findOneAndUpdate(
      {
        _id: userId,
      },
      update,
      {
        new: true,
      }
    )
      .select("savedPosts")
      .populate({
        path: "savedPosts",
        populate: {
          path: "community",
          select: "name",
        },
      });

    if (!updatedUserPost) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const formattedPosts = updatedUserPost.savedPosts.map((post) => ({
      ...post.toObject(),
      createdAt: dayjs(post.createdAt).fromNow(),
    }));

    res.status(200).json(formattedPosts);
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      message: `Server error: ${error.message}`,
    });
  }
};

const getSavedPosts = async (req, res) => {
  try {
    const userId = req.userId;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const communityIds = await Community.find({ members: userId }).distinct(
      "_id"
    );
    const savedPosts = await Post.find({
      community: { $in: communityIds },
      _id: { $in: user.savedPosts },
    })
      .populate("user", "name avatar")
      .populate("community", "name");

    const formattedPosts = savedPosts.map((post) => ({
      ...post.toObject(),
      createdAt: dayjs(post.createdAt).fromNow(),
    }));

    res.status(200).json(formattedPosts);
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      message: `Server error: ${error.message}`,
    });
  }
};

const getPublicPosts = async (req, res) => {
  try {
    const publicUserId = req.params.publicUserId;
    const currentUserId = req.userId;

    if (!ObjectId.isValid(publicUserId) || !ObjectId.isValid(currentUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const isFollowing = await Relationship.exists({
      follower: currentUserId,
      following: publicUserId,
    });
    if (!isFollowing) {
      return res.status(403).json({
        message: "You must follow the user to view their posts",
      });
    }

    const commonCommunityIds = await Community.find({
      members: { $all: [currentUserId, publicUserId] },
    }).distinct("_id");

    const publicPosts = await Post.find({
      community: { $in: commonCommunityIds },
      user: publicUserId,
    })
      .populate("user", "_id name avatar")
      .populate("community", "_id name")
      .sort("-createdAt")
      .limit(10)
      .exec();

    const formattedPosts = publicPosts.map((post) => ({
      ...post.toObject(),
      createdAt: dayjs(post.createdAt).fromNow(),
    }));

    res.status(200).json(formattedPosts);
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

module.exports = {
  getPost,
  getPosts,
  createPost,
  getCommunityPosts,
  deletePost,
  rejectPost,
  clearPendingPosts,
  confirmPost,
  likePost,
  unlikePost,
  addComment,
  savePost,
  unsavePost,
  getSavedPosts,
  getPublicPosts,
  getFollowingUsersPosts,
};

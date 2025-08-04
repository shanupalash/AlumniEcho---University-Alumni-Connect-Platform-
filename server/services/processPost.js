const { saveLogInfo } = require("../middlewares/logger/logInfo");
const createCategoryFilterService = require("./categoryFilterService");
const Config = require("../models/config.model");

const processPost = async (req, res, next) => {
  const { content, communityName, communityId } = req.body;
  const userId = req.userId;

  try {
    const { serviceProvider, timeout, bypassCategoryCheck } =
      await getSystemPreferences();

    if (serviceProvider === "disabled" || bypassCategoryCheck) {
      req.failedDetection = false;
      await saveLogInfo(
        userId,
        `Category filtering bypassed for post in community ${communityId}`,
        "processPost",
        "info"
      );
      return next();
    }

    const categoryFilterService = createCategoryFilterService(serviceProvider);

    const categories = await categoryFilterService.getCategories(
      content,
      timeout
    );

    if (Object.keys(categories).length > 0) {
      const recommendedCommunity = Object.keys(categories)[0];

      if (recommendedCommunity !== communityName) {
        const type = "categoryMismatch";
        const info = {
          community: communityName,
          recommendedCommunity,
        };
        await saveLogInfo(
          userId,
          `Category mismatch: post intended for ${communityName}, recommended ${recommendedCommunity}`,
          "processPost",
          "error"
        );
        return res.status(403).json({ type, info });
      } else {
        req.failedDetection = false;
        await saveLogInfo(
          userId,
          `Post matches community ${communityName}`,
          "processPost",
          "info"
        );
        next();
      }
    } else {
      req.failedDetection = true;
      await saveLogInfo(
        userId,
        `No categories detected for post in community ${communityId}`,
        "processPost",
        "warn"
      );
      next();
    }
  } catch (error) {
    await saveLogInfo(
      userId,
      `Error processing post: ${error.message}`,
      "processPost",
      "error"
    );
    return res
      .status(500)
      .json({ message: `Failed to process post: ${error.message}` });
  }
};

const getSystemPreferences = async () => {
  try {
    const config = await Config.findOne({}, { _id: 0, __v: 0 });

    if (!config) {
      return {
        serviceProvider: "disabled",
        timeout: 10000,
        bypassCategoryCheck: false,
      };
    }

    const {
      categoryFilteringServiceProvider: serviceProvider = "disabled",
      categoryFilteringRequestTimeout: timeout = 10000,
      bypassCategoryCheck = false,
    } = config;

    return {
      serviceProvider,
      timeout,
      bypassCategoryCheck,
    };
  } catch (error) {
    await saveLogInfo(
      null,
      `Error fetching system preferences: ${error.message}`,
      "getSystemPreferences",
      "error"
    );
    return {
      serviceProvider: "disabled",
      timeout: 10000,
      bypassCategoryCheck: false,
    };
  }
};

module.exports = processPost;

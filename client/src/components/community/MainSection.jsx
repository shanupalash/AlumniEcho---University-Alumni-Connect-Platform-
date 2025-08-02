import { memo, useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getComPostsAction,
  clearCommunityPostsAction,
} from "../../redux/actions/postActions";
import PostForm from "../form/PostForm";
import Post from "../post/Post";
import FollowingUsersPosts from "./FollowingUsersPosts";
import CommonLoading from "../loader/CommonLoading";

const MemoizedPost = memo(Post);

const MainSection = () => {
  const dispatch = useDispatch();

  const communityData = useSelector((state) => state.community?.communityData);
  const communityPosts = useSelector((state) => state.posts?.communityPosts);

  const totalCommunityPosts = useSelector(
    (state) => state.posts?.totalCommunityPosts
  );

  const [activeTab, setActiveTab] = useState("All posts");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
  const LIMIT = 10;

  const postError = useSelector((state) => state.posts?.postError);

  useEffect(() => {
    const fetchInitialPosts = async () => {
      if (communityData?._id) {
        dispatch(getComPostsAction(communityData._id, LIMIT, 0)).finally(() => {
          setIsLoading(false);
        });
      }
    };

    fetchInitialPosts();

    return () => {
      dispatch(clearCommunityPostsAction());
    };
  }, [dispatch, communityData]);

  const handleLoadMore = () => {
    if (
      !isLoadMoreLoading &&
      communityPosts.length > 0 &&
      communityPosts.length < totalCommunityPosts
    ) {
      setIsLoadMoreLoading(true);
      dispatch(
        getComPostsAction(communityData._id, LIMIT, communityPosts.length)
      ).finally(() => {
        setIsLoadMoreLoading(false);
      });
    }
  };

  const memoizedCommunityPosts = useMemo(() => {
    return communityPosts?.map((post) => (
      <MemoizedPost key={post._id} post={post} />
    ));
  }, [communityPosts]);

  if (isLoading || !communityData || !communityPosts) {
    return (
      <div className="main-section flex h-screen items-center justify-center">
        <CommonLoading />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <ul className="flex border-b border-gray-200">
        <li
          className={`flex-1 cursor-pointer px-4 py-3 text-center text-sm font-semibold ${
            activeTab === "All posts"
              ? "rounded-t-lg bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
          } transition duration-300`}
          onClick={() => setActiveTab("All posts")}
        >
          All Posts
        </li>
        <li
          className={`flex-1 cursor-pointer px-4 py-3 text-center text-sm font-semibold ${
            activeTab === "You're following"
              ? "rounded-t-lg bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
          } transition duration-300`}
          onClick={() => setActiveTab("You're following")}
        >
          You're Following
        </li>
      </ul>
      <div className="mt-6 flex flex-col gap-6">
        {activeTab === "All posts" && (
          <>
            <div className="mb-6">
              <PostForm
                communityId={communityData._id}
                communityName={communityData.name}
              />
            </div>
            {postError && (
              <div className="form-error rounded-lg border border-red-300 bg-red-50 p-4 text-center">
                {postError}
              </div>
            )}

            <div>{memoizedCommunityPosts}</div>
            {communityPosts.length < totalCommunityPosts && (
              <button
                className="form-button my-4"
                onClick={handleLoadMore}
                disabled={isLoadMoreLoading}
              >
                {isLoadMoreLoading ? "Loading..." : "Load More Posts"}
              </button>
            )}
          </>
        )}
        {activeTab === "You're following" && (
          <FollowingUsersPosts communityData={communityData} />
        )}
      </div>
    </div>
  );
};

export default MainSection;

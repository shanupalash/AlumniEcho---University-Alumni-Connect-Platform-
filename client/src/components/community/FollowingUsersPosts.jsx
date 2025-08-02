import { memo, useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getFollowingUsersPostsAction } from "../../redux/actions/postActions";
import CommonLoading from "../loader/CommonLoading";
import Post from "../post/Post";
import NoPost from "../../assets/nopost.jpg";

const MemoizedPost = memo(Post);

const FollowingUsersPosts = ({ communityData }) => {
  const dispatch = useDispatch();

  const followingUsersPosts = useSelector(
    (state) => state.posts?.followingUsersPosts
  );

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInitialPosts = async () => {
      setIsLoading(true);
      if (communityData?._id) {
        await dispatch(getFollowingUsersPostsAction(communityData._id));
      }
      setIsLoading(false);
    };
    fetchInitialPosts();
  }, [dispatch, communityData]);

  const memoizedFollowingUsersPost = useMemo(() => {
    return followingUsersPosts.map((post) => (
      <MemoizedPost key={post._id} post={post} />
    ));
  }, [followingUsersPosts]);

  return (
    <div className="main-section">
      {isLoading || !communityData ? (
        <div className="flex items-center justify-center">
          <CommonLoading />
        </div>
      ) : (
        <>
          {followingUsersPosts.length > 0 ? (
            <div>{memoizedFollowingUsersPost}</div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <p className="py-4 text-base font-medium text-gray-600">
                None of your following users have posted anything yet. Check
                back later!
              </p>
              <img
                loading="lazy"
                src={NoPost}
                alt="no post"
                className="max-w-xs rounded-lg shadow-md"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FollowingUsersPosts;

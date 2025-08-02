import { memo, useMemo, useEffect, useState, useCallback } from "react";
import {
  getPostsAction,
  clearPostsAction,
} from "../../redux/actions/postActions";
import { useSelector, useDispatch } from "react-redux";
import Post from "../post/Post";
import CommonLoading from "../loader/CommonLoading";
import Home from "../../assets/home.jpg";

const MemoizedPost = memo(Post);

const LoadMoreButton = ({ onClick, isLoading }) => (
  <button className="form-button my-4" onClick={onClick} disabled={isLoading}>
    {isLoading ? "Loading..." : "Load More Posts"}
  </button>
);

const MainSection = ({ userData }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const posts = useSelector((state) => state.posts?.posts);
  const totalPosts = useSelector((state) => state.posts?.totalPosts);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);

  const LIMIT = 10;

  useEffect(() => {
    if (userData) {
      dispatch(getPostsAction(LIMIT, 0)).finally(() => {
        setIsLoading(false);
      });
    }

    return () => {
      dispatch(clearPostsAction());
    };
  }, [userData, dispatch, LIMIT]);

  const handleLoadMore = useCallback(() => {
    setIsLoadMoreLoading(true);
    dispatch(getPostsAction(LIMIT, posts.length)).finally(() => {
      setIsLoadMoreLoading(false);
    });
  }, [dispatch, LIMIT, posts.length]);

  const memoizedPosts = useMemo(() => {
    return posts.map((post) => <MemoizedPost key={post._id} post={post} />);
  }, [posts]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <CommonLoading />
      </div>
    );
  }
  return (
    <>
      <div>{memoizedPosts}</div>

      {posts.length > 0 && posts.length < totalPosts && (
        <LoadMoreButton
          onClick={handleLoadMore}
          isLoading={isLoadMoreLoading}
        />
      )}

      {posts.length === 0 && (
        <div className="flex flex-col items-center justify-center p-6 text-center text-gray-600">
          <p className="py-4 text-base font-medium">
            No posts to show. Join a community and post something.
          </p>
          <img
            loading="lazy"
            src={Home}
            alt="no post"
            className="max-w-xs rounded-lg shadow-md"
          />
        </div>
      )}
    </>
  );
};

export default MainSection;

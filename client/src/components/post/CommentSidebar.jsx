import { useState } from "react";
import { Link } from "react-router-dom";

const CommentSidebar = ({ comments }) => {
  const currentPage = 1;
  const [commentsPerPage, setCommentsPerPage] = useState(10);

  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = comments.slice(
    indexOfFirstComment,
    indexOfLastComment
  );

  const handleLoadMore = () => {
    setCommentsPerPage(commentsPerPage + 10);
  };

  return (
    <div className="sticky top-20 col-span-1 h-[85vh] overflow-y-auto rounded-md border bg-white p-5">
      {currentComments.length > 0 && (
        <div>
          <h2 className="mb-4 border-b-2 py-2 text-center font-semibold">
            Recent Comments
          </h2>
          {currentComments.map((comment) => (
            <div
              key={comment._id}
              className="flex w-full flex-col border-b bg-white p-2"
            >
              <div className="flex gap-1">
                <img
                  src={comment.user.avatar}
                  alt="User Avatar"
                  className="h-[30px] w-[30px] overflow-hidden rounded-full object-cover"
                />

                <div className="flex flex-col">
                  <span className="text-md font-semibold hover:underline">
                    <Link to={`/user/${comment.user._id}`}>
                      {comment.user.name}
                    </Link>
                  </span>
                  <p className="ml-1 text-xs text-gray-500">
                    {comment.createdAt}
                  </p>
                </div>
              </div>
              <p className="mt-2 whitespace-normal break-words text-sm">
                {comment.content}
              </p>
            </div>
          ))}

          {currentComments.length < comments.length && (
            <button
              className="mt-3 w-full text-sm font-semibold text-primary"
              onClick={handleLoadMore}
            >
              Load More
            </button>
          )}
        </div>
      )}

      {currentComments.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center">
          <p className="mb-4 text-lg font-semibold">No Comments Yet</p>
        </div>
      )}
    </div>
  );
};

export default CommentSidebar;

const OwnInfoCard = ({ user }) => {
  return (
    <div className="my-5 space-y-2 rounded-md border bg-white p-6">
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-800">{user.name}</h3>
          <p className="text-sm capitalize text-gray-600">{user.userType}</p>
          <p className="mt-1 text-sm text-gray-700">
            {user.bio || "No bio provided"}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Joined {user.duration} ago (
          {new Date(user.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          )
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between text-sm">
        <div className="text-gray-500">Total Posts</div>
        <div className="font-medium text-gray-800">{user.totalPosts}</div>
      </div>
      <div className="flex flex-wrap items-center justify-between text-sm">
        <div className="text-gray-500">Total Communities</div>
        <div className="font-medium text-gray-800">{user.totalCommunities}</div>
      </div>
      {user.totalPosts > 0 && (
        <div className="flex flex-wrap items-center justify-between text-sm">
          <div className="text-gray-500">Posts in Communities</div>
          <div className="font-medium text-gray-800">
            {user.totalPosts} in {user.totalPostCommunities}{" "}
            {user.totalPostCommunities === 1 ? "community" : "communities"}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between text-sm">
        <div className="text-gray-500">Followers</div>
        <div className="font-medium text-gray-800">
          {user.followers?.length ?? 0}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between text-sm">
        <div className="text-gray-500">Following</div>
        <div className="font-medium text-gray-800">
          {user.following?.length ?? 0}
        </div>
      </div>
    </div>
  );
};

export default OwnInfoCard;

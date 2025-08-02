import { Link } from "react-router-dom";

const JoinedCommunityCard = ({ community }) => {
  return (
    <Link
      to={`/community/${community.name}`}
      className="mb-5 flex w-full flex-col rounded-lg border bg-white px-4 py-4 shadow-lg transition-shadow duration-300 hover:shadow-xl"
    >
      <img
        className="h-32 w-full rounded-lg object-cover"
        src={community.banner}
        alt=""
        loading="lazy"
      />
      <h3 className="mt-3 text-lg font-semibold text-gray-800">
        {community.name}
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        {community.members.length}{" "}
        {community.members.length === 1 ? "member" : "members"}
      </p>
    </Link>
  );
};

export default JoinedCommunityCard;

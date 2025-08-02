import { useState } from "react";
import JoinModal from "../modals/JoinModal";
import placeholder from "../../assets/placeholder.png";
import { MdOutlineGroupAdd } from "react-icons/md";

const CommunityCard = ({ community }) => {
  const [joinModalVisibility, setJoinModalVisibility] = useState({});

  const toggleJoinModal = (communityId, visible) => {
    setJoinModalVisibility((prev) => ({
      ...prev,
      [communityId]: visible,
    }));
  };
  return (
    <div className="rounded-lg border bg-white px-4 py-4 shadow-lg transition-shadow duration-300 hover:shadow-xl">
      <div className="flex w-full items-start">
        <img
          className="mr-4 h-12 w-12 rounded-full object-cover"
          src={community.banner || placeholder}
          alt="community banner"
          loading="lazy"
        />
        <div>
          <h4 className="line-clamp-1 text-base font-semibold text-gray-800">
            {community.name}
          </h4>
          <p className="text-sm text-gray-600">
            {community.members.length}{" "}
            {community.members.length === 1 ? "member" : "members"}
          </p>
        </div>
      </div>

      <div>
        <button
          onClick={() => toggleJoinModal(community._id, true)}
          className="rounded-lg bg-blue-600 px-3 py-3 text-white shadow-md transition duration-300 hover:bg-blue-700"
        >
          <MdOutlineGroupAdd className="text-lg" />
        </button>
        <JoinModal
          show={joinModalVisibility[community._id] || false}
          onClose={() => toggleJoinModal(community._id, false)}
          community={community}
        />
      </div>
    </div>
  );
};

export default CommunityCard;

import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import LeaveModal from "../modals/LeaveModal";
import { getCommunityAction } from "../../redux/actions/communityActions";
import placeholder from "../../assets/placeholder.png";
import CommonLoading from "../loader/CommonLoading";
import {
  useBannerLoading,
  useIsModeratorUpdated,
} from "../../hooks/useCommunityData";
import { HiUserGroup, HiOutlineCheckBadge } from "react-icons/hi2";

const Rightbar = () => {
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const dispatch = useDispatch();
  const { communityName } = useParams();

  const toggleLeaveModal = useCallback(() => {
    setShowLeaveModal((prevState) => !prevState);
  }, []);

  useEffect(() => {
    dispatch(getCommunityAction(communityName));
  }, [dispatch, communityName]);

  const communityData = useSelector((state) => state.community?.communityData);

  const isModeratorOfThisCommunity = useSelector(
    (state) => state.auth?.isModeratorOfThisCommunity
  );

  const { name, description, members, rules, banner } = useMemo(
    () => communityData || {},
    [communityData]
  );

  const bannerLoaded = useBannerLoading(banner);
  const isModeratorUpdated = useIsModeratorUpdated(isModeratorOfThisCommunity);

  if (!communityData) {
    return (
      <div className="flex justify-center">
        <CommonLoading />
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-gray-800">{name}</h2>
        <div className="mt-2 flex items-center gap-2 text-blue-600">
          <HiUserGroup className="text-lg" />
          <span className="text-sm">
            {members?.length || 0}{" "}
            {members?.length === 1 ? "member" : "members"}
          </span>
        </div>
      </div>

      {bannerLoaded ? (
        <img
          src={banner}
          alt="community banner"
          className="mt-4 h-40 w-full rounded-lg object-cover shadow-sm"
          onError={(e) => {
            e.target.src = placeholder;
          }}
        />
      ) : (
        <img
          src={placeholder}
          alt="community banner placeholder"
          className="mt-4 h-40 w-full rounded-lg object-cover shadow-sm"
        />
      )}

      <h3 className="mt-4 text-sm text-gray-600">{description}</h3>

      <div className="my-6">
        {isModeratorOfThisCommunity && (
          <Link
            to={`/community/${communityName}/moderator`}
            className="form-button mb-2 block text-center"
          >
            Moderation Panel
          </Link>
        )}

        {isModeratorUpdated && !isModeratorOfThisCommunity && (
          <button
            onClick={toggleLeaveModal}
            className="block w-full rounded-lg bg-red-50 py-3 text-sm font-semibold text-red-600 shadow-md transition duration-300 hover:bg-red-100"
          >
            Leave Community
          </button>
        )}
        {
          <LeaveModal
            show={showLeaveModal}
            toggle={toggleLeaveModal}
            communityName={communityName}
          />
        }
      </div>
      {rules && rules.length > 0 && (
        <div className="text-gray-800">
          <span className="text-sm font-semibold">Community Guidelines:</span>
          <ul className="mt-2 flex flex-col gap-3">
            {rules.map((rule) => (
              <li key={rule._id} className="flex items-start gap-2 text-sm">
                <HiOutlineCheckBadge className="mt-0.5 flex-shrink-0 text-lg text-blue-600" />
                {rule.rule}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Rightbar;

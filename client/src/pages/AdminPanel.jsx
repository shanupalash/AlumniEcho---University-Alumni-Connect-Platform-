import { useState, useEffect } from "react";
import Tab from "../components/admin/Tab";
import Logs from "../components/admin/Logs";
//import Settings from "../components/admin/Settings";
import CommunityManagement from "../components/admin/CommunityManagement";
import { useSelector, useDispatch } from "react-redux";
import { logoutAction } from "../redux/actions/adminActions";
import { useNavigate } from "react-router-dom";
const AdminPanel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("logs");
  const adminPanelError = useSelector((state) => state.admin?.adminPanelError);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    if (adminPanelError === "Unauthorized") {
      dispatch(logoutAction()).then(() => {
        navigate("/admin/signin");
      });
    }
  }, [adminPanelError, dispatch, navigate]);

  // {activeTab === "settings" && <Settings />} -paste in line 35

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-center pt-5 ">
      <Tab activeTab={activeTab} handleTabClick={handleTabClick} />

      {activeTab === "logs" && <Logs />}

      {activeTab === "Community Management" && <CommunityManagement />}
    </div>
  );
};

export default AdminPanel;

import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo1.png";
import { useState } from "react";
import ButtonLoadingSpinner from "../components/loader/ButtonLoadingSpinner";
import { IoIosArrowRoundBack } from "react-icons/io";
import { signInAction } from "../redux/actions/adminActions";
import { useDispatch, useSelector } from "react-redux";

const AdminSignIn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const signInError = useSelector((state) => state.admin?.signInError);

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = (e) => {
    setSigningIn(true);
    e.preventDefault();
    const data = {
      username: username,
      password: password,
    };

    dispatch(signInAction(data)).then(() => {
      setSigningIn(false);
      navigate("/admin");
    });
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-md bg-white shadow-md">
        <div className="px-6 py-4">
          <div className="mx-auto flex justify-center">
            <img className="h-5 w-auto" src={logo} alt="" />
          </div>

          <p className="mt-1 text-center text-gray-500">Sign in as admin</p>
          <form>
            <div className="mt-4 w-full">
              <input
                onChange={handleUsernameChange}
                className="mt-2 block w-full rounded-md border bg-white px-4 py-2 text-gray-700 placeholder-gray-500  focus:border-blue-400  focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40"
                type="text"
                placeholder="Username"
                aria-label="Username"
              />
            </div>
            <div className="mt-4 w-full">
              <input
                onChange={handlePasswordChange}
                className="mt-2 block w-full rounded-md border bg-white px-4 py-2 text-gray-700 placeholder-gray-500  focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40"
                type="password"
                placeholder="Password"
                aria-label="Password"
              />
            </div>
            {signInError && (
              <div className="relative mt-4 flex items-center justify-between rounded-md border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                <span className="block sm:inline">{signInError}</span>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <Link to="/">
                <IoIosArrowRoundBack className="mr-2 inline-block h-4 w-4" />
                Back to home
              </Link>
              <button
                disabled={signingIn}
                type="submit"
                onClick={(e) => handleSubmit(e)}
                className="transform rounded-md bg-blue-500 px-6 py-2 text-sm font-medium capitalize tracking-wide text-white transition-colors duration-300 hover:bg-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50"
              >
                {signingIn ? (
                  <ButtonLoadingSpinner loadingText={"Signing in..."} />
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSignIn;

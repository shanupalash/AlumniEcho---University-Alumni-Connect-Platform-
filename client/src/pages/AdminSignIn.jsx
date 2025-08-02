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
    <section className="flex min-h-screen items-center justify-center bg-gray-50 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-6 flex justify-center">
            <img className="h-8 w-auto" src={logo} alt="Logo" />
          </div>

          <h2 className="mb-4 text-center text-lg font-semibold text-gray-800">
            Sign in as Admin
          </h2>

          <form>
            <div className="mb-4">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                onChange={handleUsernameChange}
                className="form-input"
                type="text"
                placeholder="Username"
                aria-label="Username"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                onChange={handlePasswordChange}
                className="form-input"
                type="password"
                placeholder="Password"
                aria-label="Password"
              />
            </div>
            {signInError && (
              <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
                {signInError}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="flex items-center text-sm text-gray-600 transition duration-300 hover:text-blue-600"
              >
                <IoIosArrowRoundBack className="mr-2 h-5 w-5" />
                Back to home
              </Link>
              <button
                disabled={signingIn}
                type="submit"
                onClick={(e) => handleSubmit(e)}
                className="form-button"
              >
                {signingIn ? (
                  <ButtonLoadingSpinner loadingText="Signing in..." />
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AdminSignIn;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { signInAction, clearMessage } from "../redux/actions/authActions";
import { RxCross1 } from "react-icons/rx";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import ButtonLoadingSpinner from "../components/loader/ButtonLoadingSpinner";
import Logo from "../assets/logo1.png";

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setLoadingText("Signing in...");
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    const timeout = setTimeout(() => {
      setLoadingText(
        "This is taking longer than usual. Please wait while backend services are getting started."
      );
    }, 5000);
    await dispatch(signInAction(formData, navigate));
    setLoading(false);
    clearTimeout(timeout);
  };

  const signInError = useSelector((state) => state.auth?.signInError);
  const successMessage = useSelector((state) => state.auth?.successMessage);

  const handleClearMessage = () => {
    dispatch(clearMessage());
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-gray-50 py-12">
      <div className="container mx-auto max-w-md px-6">
        <form className="rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-6 flex justify-center">
            <img className="h-8 w-auto" src={Logo} alt="Logo" />
          </div>

          {signInError && (
            <div
              className="mb-6 flex items-center justify-between rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-600"
              role="alert"
            >
              <span className="text-sm">{signInError}</span>
              <button
                className="text-red-600 hover:text-red-800"
                onClick={handleClearMessage}
              >
                <RxCross1 className="h-4 w-4" />
              </button>
            </div>
          )}
          {successMessage && (
            <div
              className="mb-6 flex items-center justify-between rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-green-600"
              role="alert"
            >
              <span className="text-sm">{successMessage}</span>
              <button
                className="text-green-600 hover:text-green-800"
                onClick={handleClearMessage}
              >
                <RxCross1 className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mb-6 flex items-center justify-center space-x-4">
            <Link
              to="/signin"
              className="w-1/3 border-b-2 border-blue-600 py-2 text-center text-sm font-semibold text-blue-600"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="w-1/3 border-b-2 border-transparent py-2 text-center text-sm font-semibold text-gray-600 transition duration-300 hover:border-gray-300"
            >
              Sign Up
            </Link>
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </span>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input-with-icon"
                placeholder="Email address"
                required
                autoComplete="off"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </span>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input-with-icon"
                placeholder="Password"
                required
                autoComplete="off"
              />
            </div>
          </div>

          <button
            disabled={loading}
            onClick={handleSubmit}
            className="form-button"
          >
            {loading ? (
              <ButtonLoadingSpinner loadingText={loadingText} />
            ) : (
              "Sign In"
            )}
          </button>

          <div className="mt-6 flex items-center justify-center text-sm text-gray-600">
            <Link
              to="/admin"
              className="flex items-center transition duration-300 hover:text-blue-600"
            >
              <MdOutlineAdminPanelSettings className="mr-2 h-5 w-5" />
              <span>Admin</span>
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default SignIn;

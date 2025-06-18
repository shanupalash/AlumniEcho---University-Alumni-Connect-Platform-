import { useState } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { signUpAction, clearMessage } from "../redux/actions/authActions";
import { Link } from "react-router-dom";
import ContextAuthModal from "../components/modals/ContextAuthModal";
import { RxCross1 } from "react-icons/rx";
import ButtonLoadingSpinner from "../components/loader/ButtonLoadingSpinner";
import Logo from "../assets/logo1.png";

const SignUpNew = () => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarError, setAvatarError] = useState(null);
  const [userType, setUserType] = useState(""); // Changed default to empty string

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const signUpError = useSelector((state) => state.auth?.signUpError);

  const [isConsentGiven, setIsConsentGiven] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  const handleNameChange = (e) => setName(e.target.value);
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setIsModerator(e.target.value.includes("mod.socialecho.com"));
  };
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return setAvatar(null);

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setAvatar(null);
      setAvatarError("Please upload a valid image file (jpeg, jpg, png)");
    } else if (file.size > 10 * 1024 * 1024) {
      setAvatar(null);
      setAvatarError("Please upload an image file less than 10MB");
    } else {
      setAvatar(file);
      setAvatarError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userType) {
      alert("Please select a user type (Student or Alumni)");
      return;
    }
    setLoading(true);
    setLoadingText("Signing up...");
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("avatar", avatar);
    formData.append("role", "general");
    formData.append("userType", userType);
    formData.append("isConsentGiven", isConsentGiven.toString());

    // Debug: Log formData contents
    for (let pair of formData.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }

    const timeout = setTimeout(() => {
      setLoadingText(
        "This is taking longer than usual. Please wait while backend services are getting started."
      );
    }, 5000);

    await dispatch(signUpAction(formData, navigate, isConsentGiven, email));
    setLoading(false);
    setIsConsentGiven(false);
    clearTimeout(timeout);
  };

  const handleClearError = () => {
    dispatch(clearMessage());
  };

  return (
    <section className="bg-cyan-100">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-6">
        <form className="w-full max-w-md" onSubmit={handleSubmit}>
          <div className="mx-auto flex justify-center">
            <img className="h-7 w-auto sm:h-8" src={Logo} alt="Logo" />
          </div>

          {signUpError?.length > 0 &&
            signUpError.map((err, i) => (
              <div
                key={i}
                className="mt-6 flex items-center rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
                role="alert"
              >
                <span className="ml-2 block sm:inline">{err}</span>
                <button
                  className="ml-auto font-bold text-red-700"
                  onClick={handleClearError}
                >
                  <RxCross1 className="h-3 w-3" />
                </button>
              </div>
            ))}

          <div className="mt-6 flex items-center justify-center">
            <Link
              to={"/signin"}
              className="w-1/3 border-b border-gray-400 pb-4 text-center font-medium text-gray-800"
            >
              Sign In
            </Link>
            <Link
              to={"/signup"}
              className="w-1/3 border-b-2 border-blue-500 pb-4 text-center font-medium text-gray-800"
            >
              Sign Up
            </Link>
          </div>

          <div className="relative mt-8 flex items-center">
            <span className="absolute left-3 text-gray-300">👤</span>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={handleNameChange}
              className="block w-full rounded-lg border bg-white px-11 py-3 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40"
              placeholder="Name"
              required
              autoComplete="off"
            />
          </div>

          <label
            htmlFor="avatar"
            className="mx-auto mt-6 flex cursor-pointer items-center rounded-lg border-2 border-dashed bg-white px-3 py-3 text-center"
          >
            <span className="mr-2 text-gray-300">📁</span>
            <h2 className="text-gray-400">Profile Photo</h2>
            <input
              id="avatar"
              type="file"
              className="hidden"
              name="avatar"
              accept="image/*"
              onChange={handleAvatarChange}
              autoComplete="off"
            />
          </label>
          {avatar && (
            <div className="mt-2 text-center">
              <span className="font-medium text-blue-500">{avatar.name}</span>
            </div>
          )}
          {avatarError && (
            <div className="mt-2 text-center">
              <span className="text-red-500">{avatarError}</span>
            </div>
          )}

          <div className="relative mt-6 flex items-center">
            <span className="absolute left-3 text-gray-300">📧</span>
            <input
              id="email"
              name="email"
              value={email}
              onChange={handleEmailChange}
              type="email"
              className="block w-full rounded-lg border bg-white px-11 py-3 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40"
              placeholder="Email address"
              required
              autoComplete="off"
            />
          </div>

          <div className="relative mt-4 flex items-center">
            <span className="absolute left-3 text-gray-300">🔒</span>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className="block w-full rounded-lg border bg-white px-10 py-3 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40"
              placeholder="Password"
              required
              autoComplete="off"
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="userType"
              className="mb-1 block font-medium text-gray-700"
            >
              Sign up as
            </label>
            <select
              id="userType"
              name="userType"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="block w-full rounded-lg border bg-white px-4 py-3 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40"
              required
            >
              <option value="" disabled>
                Select user type
              </option>
              <option value="student">Student</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>

          <div className="mt-6">
            <button
              disabled={loading}
              type="submit"
              className={`w-full transform rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium tracking-wide text-white transition-colors duration-300 hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50 ${
                loading ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              {loading ? (
                <ButtonLoadingSpinner loadingText={loadingText} />
              ) : (
                <span>Sign Up</span>
              )}
            </button>

            <div onClick={() => setIsModalOpen(true)} className="mt-6">
              {isConsentGiven && !isModerator ? (
                <p className="mt-2 cursor-pointer rounded-lg border border-green-500 px-4 py-3 text-center text-sm font-semibold text-green-600">
                  Context-Based Authentication is enabled
                </p>
              ) : (
                <p className="mt-2 cursor-pointer rounded-lg border px-4 py-3 text-center text-sm font-semibold">
                  Context-Based Authentication is disabled
                </p>
              )}
            </div>

            <div>
              <ContextAuthModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                setIsConsentGiven={setIsConsentGiven}
                isModerator={isModerator}
              />
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default SignUpNew;

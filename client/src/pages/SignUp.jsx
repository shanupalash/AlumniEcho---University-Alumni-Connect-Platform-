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
  const [userType, setUserType] = useState("");

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
    <section className="flex min-h-screen items-center justify-center bg-gray-50 py-12">
      <div className="container mx-auto max-w-md px-6">
        <form
          className="rounded-lg bg-white p-8 shadow-lg"
          onSubmit={handleSubmit}
        >
          <div className="mb-6 flex justify-center">
            <img className="h-8 w-auto" src={Logo} alt="Logo" />
          </div>

          {signUpError?.length > 0 && (
            <div className="mb-6 space-y-2">
              {signUpError.map((err, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-600"
                  role="alert"
                >
                  <span className="text-sm">{err}</span>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={handleClearError}
                  >
                    <RxCross1 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mb-6 flex items-center justify-center space-x-4">
            <Link
              to="/signin"
              className="w-1/3 border-b-2 border-transparent py-2 text-center text-sm font-semibold text-gray-600 transition duration-300 hover:border-gray-300"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="w-1/3 border-b-2 border-blue-600 py-2 text-center text-sm font-semibold text-blue-600"
            >
              Sign Up
            </Link>
          </div>

          <div className="mb-4">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 transform text-lg text-gray-400">
                👤
              </span>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                className="form-input-with-icon"
                placeholder="Name"
                required
                autoComplete="off"
              />
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="avatar"
              className="form-label flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-center transition duration-300 hover:border-blue-500 hover:bg-blue-50"
            >
              <span className="mr-2 text-gray-400">📁</span>
              <span className="text-sm text-gray-500">Profile Photo</span>
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
                <span className="text-sm font-medium text-blue-600">
                  {avatar.name}
                </span>
              </div>
            )}
            {avatarError && (
              <div className="form-error text-center">{avatarError}</div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 transform text-lg text-gray-400">
                📧
              </span>
              <input
                id="email"
                name="email"
                value={email}
                onChange={handleEmailChange}
                type="email"
                className="form-input-with-icon"
                placeholder="Email address"
                required
                autoComplete="off"
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 transform text-lg text-gray-400">
                🔒
              </span>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                className="form-input-with-icon"
                placeholder="Password"
                required
                autoComplete="off"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="userType" className="form-label">
              Sign up as
            </label>
            <select
              id="userType"
              name="userType"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="form-input"
              required
            >
              <option value="" disabled>
                Select user type
              </option>
              <option value="student">Student</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>

          <button disabled={loading} type="submit" className="form-button">
            {loading ? (
              <ButtonLoadingSpinner loadingText={loadingText} />
            ) : (
              <span>Sign Up</span>
            )}
          </button>

          <div onClick={() => setIsModalOpen(true)} className="mt-4">
            {isConsentGiven && !isModerator ? (
              <p className="cursor-pointer rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-600">
                Context-Based Authentication is enabled
              </p>
            ) : (
              <p className="cursor-pointer rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-center text-sm font-semibold text-gray-600 transition duration-300 hover:bg-gray-100">
                Context-Based Authentication is disabled
              </p>
            )}
          </div>

          <ContextAuthModal
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            setIsConsentGiven={setIsConsentGiven}
            isModerator={isModerator}
          />
        </form>
      </div>
    </section>
  );
};

export default SignUpNew;

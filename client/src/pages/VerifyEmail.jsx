import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import axios from "axios";
import LoadingSpinner from "../components/loader/ButtonLoadingSpinner";

const BASE_URL = process.env.REACT_APP_API_URL;

const VerifyEmail = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const codeFromUrl = searchParams.get("code");
  const emailFromUrl = searchParams.get("email");
  const email = location.state ? location.state : emailFromUrl;

  const [code, setCode] = useState(codeFromUrl ? codeFromUrl : "");
  const [error, setError] = useState("");

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleVerify = useCallback(() => {
    setLoading(true);
    const verificationLink = `${BASE_URL}/auth/verify?code=${code}&email=${email}`;
    axios
      .get(verificationLink)
      .then((res) => {
        if (res.status === 200) {
          navigate("/email-verified");
          setCode("");
          setError("");
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(
          err.response.data.message || "Invalid code, please try again."
        );
        setLoading(false);
      });
  }, [code, email, navigate, setLoading, setError]);

  useEffect(() => {
    if (codeFromUrl && emailFromUrl) {
      handleVerify();
    }
  }, [codeFromUrl, emailFromUrl, handleVerify]);

  if (error === "Email is already verified") {
    navigate("/signin");
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-gray-50 py-12">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-gray-800">
          Verify Your Email Address
        </h2>

        {!codeFromUrl && !emailFromUrl && (
          <p className="mb-6 text-sm text-gray-600">
            A verification code was sent to your email address. Please either
            <span className="font-semibold"> follow </span>
            the link in the email or
            <span className="font-semibold"> enter </span>
            the code below.
          </p>
        )}

        <div className="mb-4">
          <label htmlFor="code" className="form-label">
            Verification Code
          </label>
          <input
            type="text"
            id="code"
            placeholder="Verification code"
            className="form-input"
            value={code}
            onChange={handleCodeChange}
          />
        </div>
        {error && <div className="form-error mb-4">{error}</div>}
        <div className="flex items-center space-x-4">
          <button
            disabled={loading}
            className="form-button flex-1"
            onClick={handleVerify}
          >
            {loading ? <LoadingSpinner loadingText="Verifying..." /> : "Verify"}
          </button>
          <button
            className="flex-1 rounded-lg bg-gray-200 py-3 text-sm font-semibold text-gray-800 shadow-md transition duration-300 hover:bg-gray-300"
            onClick={() => navigate("/signup")}
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
};

export default VerifyEmail;

import { useNavigate } from "react-router";

const EmailVerifiedMessage = () => {
  const navigate = useNavigate();

  return (
    <section className="flex min-h-screen items-center justify-center bg-gray-50 py-12">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-green-600">
          Congratulations!
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          Your email has been verified and your account has been created
          successfully.
        </p>
        <button onClick={() => navigate("/signin")} className="form-button">
          Login Now
        </button>
      </div>
    </section>
  );
};

export default EmailVerifiedMessage;

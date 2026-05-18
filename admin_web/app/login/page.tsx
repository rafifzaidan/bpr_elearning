import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1A1D21]">
      <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-[#2C3136] rounded-xl shadow-xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Admin Login
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            BPR E-Learning Control Center
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

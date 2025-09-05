"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const Admin: React.FC = () => {
  const router = useRouter();
  const [adminId, setAdminId] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Always accept and redirect
    router.push("/dashboard");
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>

        <form onSubmit={handleSubmit}>
          {/* Admin ID Input */}
          <div className="mb-4">
            <label htmlFor="adminId" className="block font-semibold mb-2">
              Admin ID
            </label>
            <input
              id="adminId"
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              className="w-full p-2 mb-4 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter admin ID"
              required
            />
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label htmlFor="password" className="block font-semibold mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mb-4 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter password"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-6 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Admin;

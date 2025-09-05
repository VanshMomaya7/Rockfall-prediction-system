"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NextPage } from "next";

const Miner: NextPage = () => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [selectedMine, setSelectedMine] = useState<string>("");

  // Example Indian mines
  const mines: string[] = [
    "Jharia Coalfield (Jharkhand)",
    "Singrauli Coalfield (Madhya Pradesh)",
    "Kolar Gold Fields (Karnataka)",
    "Bailadila Iron Ore Mines (Chhattisgarh)",
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    router.push("/alerts");
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen  flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Miner Login</h1>

        <form onSubmit={handleSubmit}>
          {/* Phone Number Input */}
          <div className="mb-6">
            <label htmlFor="phone" className="block font-semibold mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your phone number"
              required
            />
          </div>

          {/* Mine Selection */}
          <div className="mb-6">
            <label className="block font-semibold mb-3">Select Mine</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mines.map((mine) => (
                <label
                  key={mine}
                  className={`cursor-pointer p-3 rounded-lg border transition-all text-center
                    ${
                      selectedMine === mine
                        ? "bg-blue-600 border-blue-400 shadow-md shadow-blue-400/30"
                        : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                    }`}
                >
                  <input
                    type="radio"
                    name="mine"
                    value={mine}
                    checked={selectedMine === mine}
                    onChange={(e) => setSelectedMine(e.target.value)}
                    className="hidden"
                    required
                  />
                  <span className="font-medium">{mine}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default Miner;

import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
export default function Header() {
  const { user } = useContext(AuthContext);
  return (
    <header className="bg-gray-900 text-white p-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold">💀 Skeleton Ink</h1>
      {user && (
        <div className="flex items-center gap-2">
          <span
            className={
              "inline-block w-3 h-3 rounded-full mr-2 " +
              (user.color === "gray"
                ? "bg-gray-400"
                : user.color === "red"
                ? "bg-red-400"
                : user.color === "blue"
                ? "bg-blue-400"
                : user.color === "pink"
                ? "bg-pink-400"
                : "bg-gray-200")
            }
          ></span>
          <span className="capitalize">{user.username}</span>
        </div>
      )}
    </header>
  );
}

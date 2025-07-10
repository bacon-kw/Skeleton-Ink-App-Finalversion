import React from "react";
export default function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-30 bg-black bg-opacity-60 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-xl min-w-[300px] relative shadow-2xl">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          ✖
        </button>
        {title && <div className="font-semibold mb-4">{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
}

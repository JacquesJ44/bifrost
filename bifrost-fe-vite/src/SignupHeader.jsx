import React from "react";

export default function SignupHeader() {
  return (
    <header className="w-full bg-[#1A1D22] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16 text-center flex flex-col items-center">

        {/* Logo */}
        <img
          src="/aesir-logo3-blue.png"
          alt="Aesir Logo"
          className="h-12 md:h-14"
        />

        {/* Title */}
        <h1 className="mt-5 text-3xl md:text-4xl font-bold tracking-tight">
          Fibre Sign-Up
        </h1>

        {/* Accent underline */}
        <div className="mt-3 h-1 w-24 rounded-full bg-[#FFD21F]" />

        {/* Subtitle */}
        <p className="mt-4 max-w-2xl text-base md:text-lg text-gray-200">
          Seamless connectivity for modern living. Complete the form below and
          we’ll get your connection activated as quickly as possible.
        </p>

      </div>

      {/* Bottom accent bars */}
      <div className="w-full">
        <div className="h-2 bg-white" />
        <div className="h-3 bg-[#FFD21F]" />
      </div>
    </header>
  );
}

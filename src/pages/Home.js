import React from "react";
import { NavLink } from "react-router-dom";

export default function Home() {
    return (
        <div className="w-full flex justify-center mt-10 px-4">
            <div className="bg-gray-800 p-10 rounded-xl shadow-lg w-full max-w-xl text-white text-center">
                <h1 className="text-3xl font-bold mb-4">Welcome to Road Guard</h1>
                <p className="text-gray-300 mb-8">
                    Monitor your rides, track statistics and stay safe using our intelligent system.
                    Create an account or log in to begin.
                </p>

                <div className="flex flex-col gap-4 mt-6">
                    <NavLink
                        to="/login"
                        className="bg-green-700 hover:bg-green-600 transition px-6 py-3 rounded-lg font-semibold"
                    >
                        Sign in
                    </NavLink>

                    <NavLink
                        to="/register"
                        className="bg-red-700 hover:bg-red-600 transition px-6 py-3 rounded-lg font-semibold"
                    >
                        Sign up
                    </NavLink>
                </div>
            </div>
        </div>
    );
}

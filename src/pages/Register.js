import React, { useState } from "react";

export default function Register() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        console.log("Register form submitted:", formData);
    };

    return (
        <div className="w-full flex justify-center mt-10">
            <div className="bg-gray-800 p-10 rounded-xl shadow-lg w-full max-w-md text-white">
                <h2 className="text-2xl font-bold text-center mb-6">Sign up</h2>

                {error && (
                    <p className="bg-red-600 text-white p-2 rounded mb-4 text-center font-semibold">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        required
                        className="p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#1B885E]"
                        onChange={handleChange}
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        required
                        className={`p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 ${
                            error ? "focus:ring-red-500 ring-red-500" : "focus:ring-[#1B885E]"
                        }`}
                        onChange={handleChange}
                    />

                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm password"
                        required
                        className={`p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 ${
                            error ? "focus:ring-red-500 ring-red-500" : "focus:ring-[#1B885E]"
                        }`}
                        onChange={handleChange}
                    />

                    <div className="flex justify-between items-center mt-2">
                        <button
                            type="submit"
                            className="
                                bg-[#1B885E]
                                text-white
                                font-semibold
                                px-6 py-3
                                rounded-[10px]
                                shadow-md
                                transition
                                hover:-translate-y-1
                                hover:shadow-xl
                                focus:outline-none
                                focus:ring-0
                            "
                        >
                            Sign up
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

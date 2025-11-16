import React, { useState } from "react";

export default function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Login form submitted:", formData);
    };

    return (
        <div className="w-full flex justify-center mt-10">
            <div className="bg-gray-800 p-10 rounded-xl shadow-lg w-full max-w-md text-white">
                <h2 className="text-2xl font-bold text-center mb-6">Sign in</h2>

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
                        className="p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#1B885E]"
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
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

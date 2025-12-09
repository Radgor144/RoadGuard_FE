import React from "react";
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthForm } from '../hooks/useAuthForm';
import { FormInput, SubmitButton, ErrorMessage } from '../components/AuthForm';

export default function Login() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const auth = useAuth();
    const from = state?.from?.pathname || '/roadguard';

    const { formData, error, loading, handleChange, handleSubmit } =
        useAuthForm({ email: "", password: "" });

    const onSubmit = async (data) => {
        await auth.login(data);
        navigate(from, { replace: true });
    };

    const handleFormSubmit = handleSubmit(onSubmit);

    return (
        <div className="w-full flex justify-center mt-10">
            <div className="bg-gray-800 p-10 rounded-xl shadow-lg w-full max-w-md text-white">

                <h2 className="text-2xl font-bold text-center mb-6">Sign in</h2>

                <ErrorMessage error={error} />

                <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                    <FormInput
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        error={error}
                    />

                    <FormInput
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        error={error}
                    />

                    <div className="mt-2">
                        <SubmitButton loading={loading} label="Login" loadingLabel="Logging in..." />
                    </div>

                    <p className="text-center text-sm mt-4 text-gray-300">
                        <Link to="/register" className="text-[#1B885E] font-semibold hover:underline">
                            Create new account
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
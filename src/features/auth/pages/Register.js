import React from "react";
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthForm } from '../hooks/useAuthForm';
import { FormInput, SubmitButton, ErrorMessage } from '../components/AuthForm';

export default function Register() {
    const navigate = useNavigate();
    const auth = useAuth();

    const { formData, error, loading, handleChange, handleSubmit, setError } =
        useAuthForm({ email: "", password: "", confirmPassword: "" });

    const onSubmit = async (data) => {
        if (data.password !== data.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        await auth.register({ email: data.email, password: data.password });
        navigate('/roadguard', { replace: true });
    };

    const handleFormSubmit = handleSubmit(onSubmit);

    return (
        <div className="w-full flex justify-center mt-10">
            <div className="bg-gray-800 p-10 rounded-xl shadow-lg w-full max-w-md text-white">

                <h2 className="text-2xl font-bold text-center mb-6">Sign up</h2>

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

                    <FormInput
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={error}
                    />

                    <div className="mt-2">
                        <SubmitButton loading={loading} label="Sign up" loadingLabel="Signing up..." />
                    </div>

                    <p className="text-center text-sm mt-4 text-gray-300">
                        <Link to="/login" className="text-[#1B885E] font-semibold hover:underline">
                            Already have an account?
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

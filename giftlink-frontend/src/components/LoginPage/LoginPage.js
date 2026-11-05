import React, { useState } from "react";
import "./LoginPage.css";
import { urlConfig } from "../../config";
import { useAppContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function LoginPage() {
    // useState hook variables
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { setIsLoggedIn } = useAppContext();

    // handleLogin function
    const handleLogin = async () => {
        console.log("Inside handleLogin");

        try {
            const response = await fetch(
                `${urlConfig.backendUrl}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const json = await response.json();

            console.log("Login Response:", json);

            if (json.authtoken) {
                sessionStorage.setItem("auth-token", json.authtoken);
                sessionStorage.setItem("name", json.userName);
                sessionStorage.setItem("email", json.userEmail);

                setIsLoggedIn(true);

                navigate("/app");
            }

            if (json.error) {
                alert(json.error);
            }

        } catch (error) {
            console.error("Login Error:", error);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-4">
                    <div className="login-card p-4 border rounded">
                        <h2 className="text-center mb-4 font-weight-bold">
                            Login
                        </h2>

                        {/* Email */}
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">
                                Email
                            </label>
                            <input
                                id="email"
                                type="text"
                                className="form-control"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Password */}
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="form-control"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {/* Login Button */}
                        <button
                            className="btn btn-primary w-100 mb-3"
                            onClick={handleLogin}
                        >
                            Login
                        </button>

                        <p className="mt-4 text-center">
                            New here?{" "}
                            <a href="/app/register" className="text-primary">
                                Register Here
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
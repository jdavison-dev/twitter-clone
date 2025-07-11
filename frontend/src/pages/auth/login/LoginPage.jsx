import { useState } from "react";
import { Link } from "react-router-dom";

import XSvg from "../../../components/svgs/X";

import { MdOutlineMail } from "react-icons/md";
import { MdPassword } from "react-icons/md";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const LoginPage = () => {
	// Local state to track form input
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});

	const queryClient = useQueryClient();

	// useMutation handles login logic and its related states
	const { mutate:loginMutation, isPending, isError, error } = useMutation({
		// Login request function
		mutationFn: async ({ username, password} ) => {
			try {
				const res = await fetch("api/auth/login", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ username, password }),
				});

				const data = await res.json();

				if (!res.ok) throw new Error(data.error || "Something went wrong");
			} catch (error) {
				throw new Error(error);
			}
		},
		// On successful login, show toast and refresh authUser cache
		onSuccess: () => {
			toast.success("Logged in successfully");
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		}
	});

	// Submit handler to trigger login mutation
	const handleSubmit = (e) => {
		e.preventDefault();
		loginMutation(formData);
	};

	// Update form state when input changes
	const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	return (
		<div className='max-w-screen-xl mx-auto flex h-screen'>
			{/* Left side logo panel, visible on large screens only */}
			<div className='flex-1 hidden lg:flex items-center  justify-center'>
				<XSvg className='lg:w-2/3 fill-white' />
			</div>

			{/* Right side login form */}
			<div className='flex-1 flex flex-col justify-center items-center'>
				<form className='flex gap-4 flex-col' onSubmit={handleSubmit}>
					<XSvg className='w-24 lg:hidden fill-white' />
					<h1 className='text-4xl font-extrabold text-white'>{"Let's"} go.</h1>

					{/* Username input */}
					<label className='input input-bordered rounded flex items-center gap-2'>
						<MdOutlineMail />
						<input
							type='text'
							className='grow'
							placeholder='username'
							name='username'
							onChange={handleInputChange}
							value={formData.username}
						/>
					</label>

					{/* Password input */}
					<label className='input input-bordered rounded flex items-center gap-2'>
						<MdPassword />
						<input
							type='password'
							className='grow'
							placeholder='Password'
							name='password'
							onChange={handleInputChange}
							value={formData.password}
						/>
					</label>

					{/* Login button with loading state */}
					<button className='btn rounded-full btn-primary text-white'>
						{isPending ? 'Logging in...' : 'Login'}
					</button>

					{/* Display error message if login fails */}
					{isError && <p className='text-red-500'>
						{error.message}	
					</p>}
				</form>

				{/* Sign-up redirect for new users */}
				<div className='flex flex-col gap-2 mt-4'>
					<p className='text-white text-lg'>{"Don't"} have an account?</p>
					<Link to='/signup'>
						<button className='btn rounded-full btn-primary text-white btn-outline w-full'>Sign up</button>
					</Link>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
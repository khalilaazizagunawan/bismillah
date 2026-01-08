import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';  // Import toast

function Login() {
  const [email, setEmail] = useState('admin@toko-kue.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation: email and password required
    const emailTrim = email.trim();
    const passwordTrim = password.trim();

    if (!emailTrim || !passwordTrim) {
      const msg = 'Email dan password wajib diisi';
      toast.error(msg);
      setError(msg);
      return;
    }

    try {
      const isAdminLogin = await login(emailTrim, passwordTrim);

      if (isAdminLogin) {
        toast.success('Login admin berhasil! Selamat datang kembali 👋');
        navigate('/admin');
      } else {
        const msg = 'Email atau password salah';
        toast.error(msg);
        setError(msg);
        return;
      }
    } catch (err) {
      const errorMsg = err.message || 'Email atau password salah';
      toast.error(errorMsg);
      setError(errorMsg);
    }
  };

  return (
    <section class="min-h-screen w-full bg-pink-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center text-pink-600 mb-8">Admin Login</h1>
        {error && <p className="text-red-500 text-center mb-6">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-6 py-4 border-2 border-pink-200 rounded-full focus:outline-none focus:border-pink-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-6 py-4 border-2 border-pink-200 rounded-full focus:outline-none focus:border-pink-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-pink-600 text-white font-bold py-4 rounded-full hover:bg-pink-700 transition text-xl"
          >
            Login
          </button>
        </form>
      </div>
    </section>
  );
}

export default Login;
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { usePasswordStrength } from '@/hooks/usePasswordStrength';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';

export default function Profile() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('view'); // view, edit, password

    // Edit profile state
    const [editData, setEditData] = useState({ name: '', email: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');

    // Change password state
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const passwordStrength = usePasswordStrength(passwordData.newPassword);

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        loadProfile();
    }, [router]);

    const loadProfile = async () => {
        try {
            const response = await authApi.getProfile();
            setUser(response.data.data);
            setEditData({ name: response.data.data.name, email: response.data.data.email });
        } catch (error: any) {
            console.error('Error loading profile:', error);
            if (error.response?.status === 401) {
                sessionStorage.clear();
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError('');
        setEditSuccess('');
        setEditLoading(true);

        try {
            const response = await authApi.updateProfile(editData);
            setEditSuccess(response.data.message);
            setUser(response.data.data);

            // Update sessionStorage
            const userStr = sessionStorage.getItem('user');
            if (userStr) {
                const userData = JSON.parse(userStr);
                userData.name = response.data.data.name;
                userData.email = response.data.data.email;
                sessionStorage.setItem('user', JSON.stringify(userData));
            }

            setTimeout(() => setEditSuccess(''), 3000);
        } catch (error: any) {
            setEditError(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setEditLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (passwordStrength < 3) {
            setPasswordError('Password is too weak. Please use a stronger password.');
            return;
        }

        setPasswordLoading(true);

        try {
            const response = await authApi.changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword,
            });
            setPasswordSuccess(response.data.message);
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setPasswordSuccess(''), 3000);
        } catch (error: any) {
            setPasswordError(error.response?.data?.message || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            <header style={{
                backgroundColor: 'white',
                borderBottom: '1px solid #e5e7eb',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                    My Profile
                </h1>
                <button
                    onClick={() => router.push('/')}
                    className="btn"
                    style={{ backgroundColor: '#6b7280', color: 'white', padding: '0.5rem 1rem' }}
                >
                    ← Back to Home
                </button>
            </header>

            <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e5e7eb' }}>
                    <button
                        onClick={() => setActiveTab('view')}
                        style={{
                            padding: '1rem 2rem',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeTab === 'view' ? '2px solid #4f46e5' : 'none',
                            color: activeTab === 'view' ? '#4f46e5' : '#6b7280',
                            fontWeight: activeTab === 'view' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            marginBottom: '-2px',
                        }}
                    >
                        View Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('edit')}
                        style={{
                            padding: '1rem 2rem',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeTab === 'edit' ? '2px solid #4f46e5' : 'none',
                            color: activeTab === 'edit' ? '#4f46e5' : '#6b7280',
                            fontWeight: activeTab === 'edit' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            marginBottom: '-2px',
                        }}
                    >
                        Edit Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        style={{
                            padding: '1rem 2rem',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeTab === 'password' ? '2px solid #4f46e5' : 'none',
                            color: activeTab === 'password' ? '#4f46e5' : '#6b7280',
                            fontWeight: activeTab === 'password' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            marginBottom: '-2px',
                        }}
                    >
                        Change Password
                    </button>
                </div>

                {/* View Profile Tab */}
                {activeTab === 'view' && user && (
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Profile Information</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.5rem' }}>Name</label>
                                <p style={{ fontSize: '1rem', fontWeight: '500' }}>{user.name}</p>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.5rem' }}>Email</label>
                                <p style={{ fontSize: '1rem', fontWeight: '500' }}>{user.email}</p>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.5rem' }}>Role</label>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    backgroundColor: user.role === 'admin' ? '#dbeafe' : '#e0e7ff',
                                    color: user.role === 'admin' ? '#1e40af' : '#4f46e5',
                                    textTransform: 'capitalize',
                                }}>
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Profile Tab */}
                {activeTab === 'edit' && (
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Edit Profile</h2>

                        {editError && (
                            <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                {editError}
                            </div>
                        )}
                        {editSuccess && (
                            <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                {editSuccess}
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    required
                                    minLength={2}
                                    maxLength={100}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={editData.email}
                                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '1rem' }}
                                disabled={editLoading}
                            >
                                {editLoading ? 'Updating...' : 'Update Profile'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Change Password Tab */}
                {activeTab === 'password' && (
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Change Password</h2>

                        {passwordError && (
                            <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                {passwordError}
                            </div>
                        )}
                        {passwordSuccess && (
                            <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                {passwordSuccess}
                            </div>
                        )}

                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwordData.oldPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    required
                                    minLength={8}
                                    maxLength={100}
                                />
                                {passwordData.newPassword && (
                                    <PasswordStrengthIndicator strength={passwordStrength} />
                                )}
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                    Must contain at least 8 characters, including uppercase, lowercase, and numbers
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    required
                                    minLength={8}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '1rem' }}
                                disabled={passwordLoading}
                            >
                                {passwordLoading ? 'Changing Password...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}

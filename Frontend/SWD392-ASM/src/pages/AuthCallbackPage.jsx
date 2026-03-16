import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { setCredentials } from '@/stores/authSlice';
import { getMeApi, handleGoogleCallback } from '@/features/auth/api/authApi';

/**
 * Trang xử lý redirect callback từ Google OAuth.
 * URL: /auth/callback?token=xxx&email=xxx&role=xxx
 * Hoặc: /auth/callback?code=xxx (code exchange flow)
 */
export function AuthCallbackPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState(null);

    useEffect(() => {
        const processCallback = async () => {
            try {
                // Trường hợp 1: Backend redirect về với token (qua Vite proxy)
                const token = searchParams.get('token');
                const email = searchParams.get('email');
                const role = searchParams.get('role');

                if (token) {
                    // Lưu token trước để getMeApi có thể dùng
                    localStorage.setItem('accessToken', token);

                    // Gọi /auth/me để lấy full profile
                    try {
                        const res = await getMeApi();
                        // axiosClient interceptor strips .data → res = { success, data: { user } }
                        const userData = res?.data?.user || res?.user || res;
                        // Normalize role field
                        const roles = userData?.user_roles?.map((ur) => ur.role?.role_name) || [];
                        const userObj = {
                            ...userData,
                            role: role || roles[0] || 'MEMBER',
                            roles,
                        };
                        dispatch(setCredentials({ user: userObj, token }));
                    } catch {
                        // Fallback: dùng basic info từ query params
                        dispatch(setCredentials({ user: { email, role: role || 'MEMBER' }, token }));
                    }

                    toast.success('Đăng nhập thành công!');
                    navigate('/dashboard', { replace: true });
                    return;
                }

                // Trường hợp 2: Google trả code, cần gọi backend để đổi token
                const code = searchParams.get('code');
                if (code) {
                    const data = await handleGoogleCallback(code);
                    dispatch(setCredentials({ user: data.user, token: data.token }));
                    toast.success('Đăng nhập thành công!');
                    navigate('/dashboard', { replace: true });
                    return;
                }

                // Không có params hợp lệ
                const errorMsg = searchParams.get('error');
                setError(errorMsg || 'Không nhận được thông tin xác thực từ Google');
            } catch (err) {
                setError(err?.response?.data?.message ?? 'Đăng nhập thất bại, vui lòng thử lại');
            }
        };

        processCallback();
    }, [searchParams, dispatch, navigate]);

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
                <div className="text-5xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold">Đăng nhập thất bại</h1>
                <p className="mt-2 text-muted-foreground max-w-md">{error}</p>
                <button
                    onClick={() => navigate('/login', { replace: true })}
                    className="mt-6 text-primary hover:underline text-sm"
                >
                    ← Quay lại trang đăng nhập
                </button>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang xác thực tài khoản Google...</p>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { setCredentials } from '@/stores/authSlice';
import { authService } from '@/services/authService';

/**
 * Trang xử lý redirect callback từ Google OAuth.
 * URL: /auth/callback?code=xxx hoặc /auth/callback?token=xxx&user=xxx
 */
export function AuthCallbackPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState(null);

    useEffect(() => {
        const processCallback = async () => {
            try {
                // Backend redirect về với token, email, role
                const token = searchParams.get('token');
                const email = searchParams.get('email');
                const role = searchParams.get('role');

                if (token) {
                    const user = { email, role };
                    dispatch(setCredentials({ user, token }));
                    toast.success('Đăng nhập thành công!');
                    navigate('/dashboard', { replace: true });
                    return;
                }

                // Trường hợp 2: Google trả code, cần gọi backend để đổi token
                const code = searchParams.get('code');
                if (code) {
                    const data = await authService.handleGoogleCallback(code);
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

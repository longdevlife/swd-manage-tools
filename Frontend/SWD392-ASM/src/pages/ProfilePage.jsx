import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Mail, Phone, Calendar, Shield, Pencil, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { selectCurrentUser, setUser } from '@/stores/authSlice';
import axiosClient from '@/services/axiosClient';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABEL = {
    ROLE_ADMIN: 'Admin',
    ROLE_LECTURER: 'Giảng viên',
    ROLE_LEADER: 'Trưởng nhóm',
    ROLE_MEMBER: 'Thành viên',
};

const ROLE_BADGE_VARIANT = {
    ROLE_ADMIN: 'destructive',
    ROLE_LECTURER: 'secondary',
    ROLE_LEADER: 'default',
    ROLE_MEMBER: 'outline',
};

function getInitials(user) {
    if (user?.name) {
        return user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }
    if (user?.username) return user.username.slice(0, 2).toUpperCase();
    return 'U';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfilePage() {
    const dispatch = useDispatch();
    const currentUser = useSelector(selectCurrentUser);

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        username: '',
        email: '',
        phoneNumber: '',
        yob: '',
    });

    // Đồng bộ form với user từ Redux
    useEffect(() => {
        if (currentUser) {
            setForm({
                username: currentUser.username ?? currentUser.name ?? '',
                email: currentUser.email ?? '',
                phoneNumber: currentUser.phoneNumber ?? '',
                yob: currentUser.yob ?? '',
            });
        }
    }, [currentUser]);

    const updateField = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleCancel = () => {
        setIsEditing(false);
        if (currentUser) {
            setForm({
                username: currentUser.username ?? currentUser.name ?? '',
                email: currentUser.email ?? '',
                phoneNumber: currentUser.phoneNumber ?? '',
                yob: currentUser.yob ?? '',
            });
        }
    };

    const handleSave = async () => {
        if (!form.username.trim()) {
            toast.error('Tên người dùng không được để trống');
            return;
        }

        setIsLoading(true);
        try {
            const res = await axiosClient.put(`/users/${currentUser.id || currentUser.user_id}`, {
                username: form.username.trim(),
                email: form.email.trim(),
                phoneNumber: form.phoneNumber.trim() || undefined,
                yob: form.yob ? Number(form.yob) : undefined,
            });
            const updatedUser = res?.data || res;
            dispatch(setUser(updatedUser));
            setIsEditing(false);
            toast.success('Cập nhật hồ sơ thành công!');
        } catch (err) {
            toast.error(err?.response?.data?.message ?? 'Cập nhật thất bại, vui lòng thử lại');
        } finally {
            setIsLoading(false);
        }
    };

    const infoItems = [
        { icon: User, label: 'Tên người dùng', value: currentUser?.username ?? currentUser?.name ?? '—' },
        { icon: Mail, label: 'Email', value: currentUser?.email ?? '—' },
        { icon: Phone, label: 'Số điện thoại', value: currentUser?.phoneNumber ?? '—' },
        { icon: Calendar, label: 'Năm sinh', value: currentUser?.yob ?? '—' },
        {
            icon: Shield,
            label: 'Vai trò',
            value: currentUser?.role ? (
                <Badge variant={ROLE_BADGE_VARIANT[currentUser.role] ?? 'outline'}>
                    {ROLE_LABEL[currentUser.role] ?? currentUser.role}
                </Badge>
            ) : (
                '—'
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Hồ sơ cá nhân"
                description="Xem và quản lý thông tin tài khoản của bạn."
            />

            {/* Profile Banner */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                        <Avatar className="h-20 w-20 text-2xl">
                            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                                {getInitials(currentUser)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-center sm:text-left">
                            <h2 className="text-xl font-bold">
                                {currentUser?.username ?? currentUser?.name ?? 'User'}
                            </h2>
                            <p className="text-sm text-muted-foreground">{currentUser?.email ?? ''}</p>
                            {currentUser?.role && (
                                <Badge
                                    variant={ROLE_BADGE_VARIANT[currentUser.role] ?? 'outline'}
                                    className="mt-2"
                                >
                                    {ROLE_LABEL[currentUser.role] ?? currentUser.role}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account Info / Edit Form */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Thông tin tài khoản</CardTitle>
                            <CardDescription>Chi tiết thông tin cá nhân của bạn</CardDescription>
                        </div>
                        {!isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Pencil size={14} className="mr-1.5" />
                                Chỉnh sửa
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-username">Tên người dùng</Label>
                                    <Input
                                        id="edit-username"
                                        value={form.username}
                                        onChange={updateField('username')}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        value={form.email}
                                        onChange={updateField('email')}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-phone">Số điện thoại</Label>
                                    <Input
                                        id="edit-phone"
                                        type="tel"
                                        value={form.phoneNumber}
                                        onChange={updateField('phoneNumber')}
                                        disabled={isLoading}
                                        placeholder="0912 345 678"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-yob">Năm sinh</Label>
                                    <Input
                                        id="edit-yob"
                                        type="number"
                                        value={form.yob}
                                        onChange={updateField('yob')}
                                        disabled={isLoading}
                                        placeholder="2003"
                                        min="1950"
                                        max="2010"
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                                    <X size={14} className="mr-1.5" />
                                    Huỷ
                                </Button>
                                <Button onClick={handleSave} disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} className="mr-1.5" />
                                            Lưu thay đổi
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {infoItems.map((item) => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                        <item.icon size={16} className="text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-muted-foreground">{item.label}</p>
                                        <div className="text-sm font-medium">{item.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

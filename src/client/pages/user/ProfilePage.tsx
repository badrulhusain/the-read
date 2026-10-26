import { useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/uploads/ImageUpload';
import { apiMessage } from '@/lib/api';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/store/authStore';

export default function ProfilePage() {
  const { user, fetchMe } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [avatarPublicId, setAvatarPublicId] = useState(user?.avatarPublicId ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function save() {
    if (!name.trim()) return toast.error('Name is required.');
    if (uploading) return toast.error('Wait for the avatar upload to finish.');
    setSaving(true);
    try {
      await authService.updateProfile({
        name: name.trim(),
        avatarUrl: avatarUrl || null,
        avatarPublicId: avatarPublicId || null,
      });
      await fetchMe();
      toast.success('Profile updated.');
    } catch (error) {
      toast.error(apiMessage(error, 'Could not update profile.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-serif text-3xl font-semibold text-[#231b17]">Profile</h2>
        <p className="text-sm text-[#74685f]">Keep your profile information current.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-start">
          <div className="flex justify-center md:justify-start">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" loading="lazy" className="h-32 w-32 rounded-full border border-[#ded3c4] object-cover" />
            ) : (
              <span className="flex h-32 w-32 items-center justify-center rounded-full bg-[#53693a] font-serif text-4xl font-semibold text-[#fffaf1]">{initials(name)}</span>
            )}
          </div>
          <div className="space-y-4">
            <Input value={name} maxLength={120} disabled={saving} onChange={(event) => setName(event.target.value)} placeholder="Display name" />
            <ImageUpload
              type="PROFILE_IMAGE"
              label="Avatar"
              value={avatarUrl}
              publicId={avatarPublicId}
              disabled={saving}
              onUploadingChange={setUploading}
              onChange={(image) => {
                setAvatarUrl(image?.url ?? '');
                setAvatarPublicId(image?.publicId ?? '');
              }}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" disabled={saving || uploading} onClick={() => void save()}>
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save profile'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function initials(name?: string) {
  return (name ?? 'TR').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

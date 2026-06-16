import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateProfile } from '../api/hooks';
import { InterestPicker } from '../components/InterestPicker';
import { PhotoEditor } from '../components/PhotoEditor';
import { useToast } from '../components/Toast';
import { IconChevronLeft } from '../components/icons';
import { useAuth } from '../store/auth';

const GENDERS = [
  { value: 'female', label: '女性' },
  { value: 'male', label: '男性' },
  { value: 'nonbinary', label: 'ノンバイナリー' },
  { value: 'other', label: 'その他' },
  { value: 'unspecified', label: '回答しない' },
];

export function EditProfile() {
  const user = useAuth((s) => s.user);
  const update = useUpdateProfile();
  const navigate = useNavigate();
  const show = useToast((s) => s.show);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [headline, setHeadline] = useState(user?.headline ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [link, setLink] = useState(user?.link ?? '');
  const [pronouns, setPronouns] = useState(user?.pronouns ?? '');
  const [gender, setGender] = useState(user?.gender ?? 'unspecified');
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [photos, setPhotos] = useState<string[]>(user?.photos ?? []);

  async function save() {
    try {
      await update.mutateAsync({
        displayName,
        username: username.toLowerCase(),
        headline,
        bio,
        location,
        link,
        pronouns,
        gender,
        interests,
        photos,
      });
      show('保存しました');
      navigate('/app/profile');
    } catch (e) {
      show(e instanceof Error && e.message === 'username_taken' ? 'そのユーザー名は使われています' : '保存に失敗しました');
    }
  }

  return (
    <div className="screen subpage">
      <header className="chat-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="戻る">
          <IconChevronLeft />
        </button>
        <span className="subpage-title">プロフィールを編集</span>
        <button
          className="btn btn-ghost"
          style={{ height: 40, padding: '0 8px' }}
          onClick={save}
          disabled={update.isPending}
        >
          {update.isPending ? '…' : '保存'}
        </button>
      </header>

      <div className="screen-scroll subpage-body">
        <h4 className="section-label">写真</h4>
        <PhotoEditor photos={photos} onChange={setPhotos} />

        <div className="field" style={{ marginTop: 22 }}>
          <label>表示名</label>
          <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} />
        </div>
        <div className="field">
          <label>ユーザー名</label>
          <div className="username-field">
            <span>@</span>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="username"
              maxLength={20}
            />
          </div>
          <span className="field-hint">半角英数字とアンダースコアのみ。</span>
        </div>
        <div className="field">
          <label>ひとこと</label>
          <input
            className="input"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="例: 週末はカメラ片手に散歩"
            maxLength={60}
          />
        </div>
        <div className="field">
          <label>自己紹介</label>
          <textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} />
        </div>
        <div className="field">
          <label>エリア</label>
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} />
        </div>
        <div className="field">
          <label>リンク</label>
          <input
            className="input"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="例: instagram.com/yourname"
            maxLength={120}
          />
        </div>
        <div className="field">
          <label>代名詞（任意）</label>
          <input
            className="input"
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            placeholder="例: she/her, he/him, they/them"
            maxLength={40}
          />
        </div>
        <div className="field">
          <label>性別</label>
          <select className="select" value={gender} onChange={(e) => setGender(e.target.value as typeof gender)}>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <h4 className="section-label" style={{ marginTop: 8 }}>
          趣味・関心
        </h4>
        <InterestPicker value={interests} onChange={setInterests} />

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 24 }}
          onClick={save}
          disabled={update.isPending}
        >
          {update.isPending ? '保存中…' : '保存する'}
        </button>
      </div>
    </div>
  );
}

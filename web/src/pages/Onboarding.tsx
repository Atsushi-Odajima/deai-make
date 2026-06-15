import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateProfile } from '../api/hooks';
import { InterestPicker } from '../components/InterestPicker';
import { PhotoEditor } from '../components/PhotoEditor';
import { useToast } from '../components/Toast';
import { useAuth } from '../store/auth';

export function Onboarding() {
  const user = useAuth((s) => s.user);
  const update = useUpdateProfile();
  const navigate = useNavigate();
  const show = useToast((s) => s.show);

  const [step, setStep] = useState(0);
  const [headline, setHeadline] = useState(user?.headline ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [photos, setPhotos] = useState<string[]>(user?.photos ?? []);

  const steps = ['プロフィール', '趣味', '写真'];

  async function finish() {
    try {
      await update.mutateAsync({ headline, bio, location, interests, photos });
      show('プロフィールを設定しました');
      navigate('/app/discover', { replace: true });
    } catch {
      show('保存に失敗しました');
    }
  }

  return (
    <div className="screen auth-screen">
      <div className="screen-scroll auth-body">
        <div className="onb-progress">
          {steps.map((s, i) => (
            <div key={s} className={`onb-dot${i <= step ? ' done' : ''}`} />
          ))}
        </div>
        <h1 className="auth-title">{steps[step]}</h1>
        <p className="auth-sub">
          {step === 0 && 'あなたを少し教えてください'}
          {step === 1 && '好きなこと・興味のあることを選びましょう'}
          {step === 2 && '写真を追加すると、ぐっと印象がよくなります'}
        </p>

        {step === 0 && (
          <>
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
              <textarea
                className="textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="どんな人とつながりたいか、最近ハマっていることなど"
                maxLength={500}
              />
            </div>
            <div className="field">
              <label>エリア</label>
              <input
                className="input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例: 東京"
                maxLength={80}
              />
            </div>
          </>
        )}

        {step === 1 && <InterestPicker value={interests} onChange={setInterests} />}

        {step === 2 && <PhotoEditor photos={photos} onChange={setPhotos} />}
      </div>

      <div className="auth-footer">
        {step > 0 && (
          <button className="btn btn-subtle" onClick={() => setStep(step - 1)}>
            戻る
          </button>
        )}
        {step < steps.length - 1 ? (
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(step + 1)}>
            次へ
          </button>
        ) : (
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={update.isPending}
            onClick={finish}
          >
            {update.isPending ? '保存中…' : 'はじめる'}
          </button>
        )}
      </div>
    </div>
  );
}

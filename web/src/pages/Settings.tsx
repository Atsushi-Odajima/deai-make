import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateProfile } from '../api/hooks';
import { useToast } from '../components/Toast';
import { IconChevronLeft } from '../components/icons';
import { closeSocket } from '../lib/socket';
import { useAuth } from '../store/auth';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className={`toggle${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className="toggle-knob" />
    </button>
  );
}

export function Settings() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const update = useUpdateProfile();
  const show = useToast((s) => s.show);

  const [discovery, setDiscovery] = useState(user?.discoveryEnabled ?? true);
  const [showAge, setShowAge] = useState(user?.showAge ?? true);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(99);

  function patch(p: Record<string, unknown>, message?: string) {
    update.mutate(p, { onSuccess: () => message && show(message) });
  }

  function doLogout() {
    closeSocket();
    logout();
    navigate('/', { replace: true });
  }

  const ages = Array.from({ length: 82 }, (_, i) => 18 + i);

  return (
    <div className="screen subpage">
      <header className="chat-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="戻る">
          <IconChevronLeft />
        </button>
        <span className="subpage-title">設定</span>
        <span style={{ width: 40 }} />
      </header>

      <div className="screen-scroll subpage-body">
        <section className="settings-group">
          <h4 className="section-label">ディスカバリー</h4>
          <div className="setting-row">
            <div>
              <div className="setting-name">発見に表示する</div>
              <div className="setting-desc">オフにすると他の人に表示されません</div>
            </div>
            <Toggle
              checked={discovery}
              onChange={(v) => {
                setDiscovery(v);
                patch({ discoveryEnabled: v });
              }}
            />
          </div>
          <div className="setting-row">
            <div>
              <div className="setting-name">年齢を表示する</div>
              <div className="setting-desc">プロフィールに年齢を表示します</div>
            </div>
            <Toggle
              checked={showAge}
              onChange={(v) => {
                setShowAge(v);
                patch({ showAge: v });
              }}
            />
          </div>
          <div className="setting-row">
            <div className="setting-name">表示する年齢の範囲</div>
            <div className="age-range">
              <select
                className="select age-select"
                value={ageMin}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setAgeMin(v);
                  patch({ prefAgeMin: v });
                }}
              >
                {ages.map((a) => (
                  <option key={a} value={a} disabled={a > ageMax}>
                    {a}
                  </option>
                ))}
              </select>
              <span>〜</span>
              <select
                className="select age-select"
                value={ageMax}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setAgeMax(v);
                  patch({ prefAgeMax: v });
                }}
              >
                {ages.map((a) => (
                  <option key={a} value={a} disabled={a < ageMin}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="settings-group">
          <h4 className="section-label">アカウント</h4>
          <div className="setting-row">
            <div className="setting-name">メールアドレス</div>
            <span className="muted">{user?.email}</span>
          </div>
        </section>

        <section className="settings-group">
          <h4 className="section-label">Mingleについて</h4>
          <p className="settings-about">
            Mingleは趣味や関心でつながるソーシャルアプリです。恋愛・結婚を目的とした異性紹介
            サービスではありません。安心してご利用いただくため、不適切な行為を見つけた場合は
            通報・ブロック機能をご利用ください。
          </p>
        </section>

        <button className="btn btn-danger btn-block" onClick={doLogout}>
          ログアウト
        </button>
      </div>
    </div>
  );
}

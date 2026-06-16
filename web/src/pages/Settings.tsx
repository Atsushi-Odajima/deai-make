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
  const [showOccupation, setShowOccupation] = useState(user?.showOccupation ?? true);
  const [showHeight, setShowHeight] = useState(user?.showHeight ?? true);
  const [showBodyType, setShowBodyType] = useState(user?.showBodyType ?? true);
  const [showWeight, setShowWeight] = useState(user?.showWeight ?? true);

  function patch(p: Record<string, unknown>, message?: string) {
    update.mutate(p, { onSuccess: () => message && show(message) });
  }

  function doLogout() {
    closeSocket();
    logout();
    navigate('/', { replace: true });
  }

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
          <h4 className="section-label">プライバシー</h4>
          <div className="setting-row">
            <div>
              <div className="setting-name">検索に表示する</div>
              <div className="setting-desc">オフにすると検索結果やおすすめに表示されません</div>
            </div>
            <Toggle
              checked={discovery}
              onChange={(v) => {
                setDiscovery(v);
                patch({ discoveryEnabled: v });
              }}
            />
          </div>
        </section>

        <section className="settings-group">
          <h4 className="section-label">プロフィール項目の公開</h4>
          <p className="setting-desc" style={{ margin: '-4px 0 6px' }}>
            オフにした項目は他の人には表示されず、検索の絞り込み対象からも外れます。
          </p>
          {[
            { name: '年齢', checked: showAge, set: setShowAge, key: 'showAge' },
            { name: '仕事', checked: showOccupation, set: setShowOccupation, key: 'showOccupation' },
            { name: '身長', checked: showHeight, set: setShowHeight, key: 'showHeight' },
            { name: '体型', checked: showBodyType, set: setShowBodyType, key: 'showBodyType' },
            { name: '体重', checked: showWeight, set: setShowWeight, key: 'showWeight' },
          ].map((row) => (
            <div className="setting-row" key={row.key}>
              <div className="setting-name">{row.name}を公開する</div>
              <Toggle
                checked={row.checked}
                onChange={(v) => {
                  row.set(v);
                  patch({ [row.key]: v });
                }}
              />
            </div>
          ))}
        </section>

        <section className="settings-group">
          <h4 className="section-label">コンテンツ</h4>
          <button className="setting-row link-row" onClick={() => navigate('/app/archive')}>
            <div className="setting-name">ストーリーズアーカイブ</div>
            <span className="muted">›</span>
          </button>
          <button className="setting-row link-row" onClick={() => navigate('/app/footprints')}>
            <div className="setting-name">あしあと</div>
            <span className="muted">›</span>
          </button>
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

import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { IconChevronLeft } from '../components/icons';
import { useAuth } from '../store/auth';

const ERRORS: Record<string, string> = {
  email_taken: 'このメールアドレスは既に登録されています。',
  must_be_18: 'Mingleは18歳以上が対象です。',
  invalid_input: 'パスワードは8文字以上、メール形式などをご確認ください。',
};

const GENDERS = [
  { value: 'female', label: '女性' },
  { value: 'male', label: '男性' },
  { value: 'nonbinary', label: 'ノンバイナリー' },
  { value: 'other', label: 'その他' },
  { value: 'unspecified', label: '回答しない' },
];

export function Register() {
  const register = useAuth((s) => s.register);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    birthdate: '',
    gender: 'unspecified',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register({ ...form, displayName: form.displayName.trim(), email: form.email.trim() });
      navigate('/app/onboarding', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? ERRORS[err.code] ?? '登録に失敗しました。' : 'エラーが発生しました。',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen auth-screen">
      <div className="auth-head">
        <Link to="/" className="icon-btn">
          <IconChevronLeft />
        </Link>
      </div>
      <div className="screen-scroll auth-body">
        <h1 className="auth-title">アカウント作成</h1>
        <p className="auth-sub">数十秒で完了します</p>

        <form onSubmit={submit}>
          <div className="field">
            <label>表示名</label>
            <input
              className="input"
              value={form.displayName}
              onChange={(e) => set('displayName', e.target.value)}
              placeholder="ニックネーム"
              maxLength={40}
              required
            />
          </div>
          <div className="field">
            <label>メールアドレス</label>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>パスワード</label>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="8文字以上"
              minLength={8}
              required
            />
          </div>
          <div className="field">
            <label>生年月日</label>
            <input
              className="input"
              type="date"
              value={form.birthdate}
              onChange={(e) => set('birthdate', e.target.value)}
              required
            />
            <span className="field-hint">年齢確認に使用します（18歳以上）。</span>
          </div>
          <div className="field">
            <label>性別</label>
            <select
              className="select"
              value={form.gender}
              onChange={(e) => set('gender', e.target.value)}
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? '作成中…' : 'アカウントを作成'}
          </button>
        </form>

        <p className="auth-switch">
          すでにアカウントをお持ちですか？ <Link to="/login">ログイン</Link>
        </p>
      </div>
    </div>
  );
}

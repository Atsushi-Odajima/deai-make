import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { IconChevronLeft } from '../components/icons';
import { useAuth } from '../store/auth';

const ERRORS: Record<string, string> = {
  invalid_credentials: 'メールアドレスまたはパスワードが正しくありません。',
  invalid_input: '入力内容を確認してください。',
};

export function Login() {
  const login = useAuth((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState('you@mingle.app');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigate('/app/discover', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? ERRORS[err.code] ?? 'ログインに失敗しました。' : 'エラーが発生しました。');
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
        <h1 className="auth-title">おかえりなさい</h1>
        <p className="auth-sub">Mingleにログイン</p>

        <form onSubmit={submit}>
          <div className="field">
            <label>メールアドレス</label>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>パスワード</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'ログイン中…' : 'ログイン'}
          </button>
        </form>

        <p className="auth-switch">
          アカウントをお持ちでない方は <Link to="/register">新規登録</Link>
        </p>
        <p className="auth-demo">デモ: you@mingle.app / password123</p>
      </div>
    </div>
  );
}

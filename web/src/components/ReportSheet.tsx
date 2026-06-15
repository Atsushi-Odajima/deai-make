import { useState } from 'react';
import { useReport } from '../api/hooks';
import { useToast } from './Toast';
import { Sheet } from './Sheet';

const REASONS = [
  { value: 'spam', label: 'スパム・宣伝' },
  { value: 'harassment', label: '嫌がらせ・迷惑行為' },
  { value: 'inappropriate', label: '不適切なコンテンツ' },
  { value: 'fake', label: 'なりすまし・偽アカウント' },
  { value: 'underage', label: '18歳未満の疑い' },
  { value: 'other', label: 'その他' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export function ReportSheet({ open, onClose, userId, userName }: Props) {
  const report = useReport();
  const show = useToast((s) => s.show);
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState('');

  function submit() {
    if (!reason) return;
    report.mutate(
      { userId, reason, detail },
      {
        onSuccess: () => {
          show('通報を受け付けました。ご協力ありがとうございます。');
          setReason(null);
          setDetail('');
          onClose();
        },
      },
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title={`${userName}さんを通報`}>
      <p className="muted" style={{ marginBottom: 14, fontSize: 14 }}>
        理由を選択してください。報告は匿名で運営に送信されます。
      </p>
      <div className="report-reasons">
        {REASONS.map((r) => (
          <button
            key={r.value}
            className={`report-reason${reason === r.value ? ' selected' : ''}`}
            onClick={() => setReason(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>
      <textarea
        className="textarea"
        placeholder="詳細（任意）"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        maxLength={1000}
        style={{ marginTop: 12 }}
      />
      <button
        className="btn btn-danger btn-block"
        style={{ marginTop: 14 }}
        disabled={!reason || report.isPending}
        onClick={submit}
      >
        通報する
      </button>
    </Sheet>
  );
}

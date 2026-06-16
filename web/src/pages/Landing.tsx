import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { IconBoard, IconDM, IconSearch } from '../components/icons';

export function Landing() {
  return (
    <div className="screen landing">
      <div className="landing-glow" />
      <div className="landing-inner">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="landing-hero"
        >
          <div className="landing-logo">
            <span className="landing-mark">m</span>
          </div>
          <h1 className="landing-title">Mingle</h1>
          <p className="landing-tag">
            趣味でつながる、あたらしいSNS。
            <br />
            投稿をシェアして、気の合う人とつながろう。
          </p>
        </motion.div>

        <motion.div
          className="landing-cards"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        >
          {[
            { icon: IconSearch, title: '検索でみつける', text: '名前や趣味で気になる人を探す' },
            { icon: IconDM, title: '気軽にDM', text: 'マッチ不要、すぐにメッセージ' },
            { icon: IconBoard, title: '掲示板でつながる', text: '募集・イベント・雑談まで' },
          ].map(({ icon: Icon, title, text }) => (
            <motion.div
              key={title}
              className="landing-feature"
              variants={{ hidden: { opacity: 0, x: 16 }, show: { opacity: 1, x: 0 } }}
            >
              <div className="landing-feature-icon">
                <Icon width={22} height={22} />
              </div>
              <div>
                <div className="landing-feature-title">{title}</div>
                <div className="landing-feature-text">{text}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="landing-actions">
          <Link to="/register" className="btn btn-primary btn-block">
            はじめる
          </Link>
          <Link to="/login" className="btn btn-ghost btn-block landing-login">
            ログイン
          </Link>
          <p className="landing-note">
            ※ Mingleは恋愛・異性紹介を目的としたサービスではありません。趣味や関心でつながる
            ソーシャルアプリです。18歳以上が対象です。
          </p>
        </div>
      </div>
    </div>
  );
}

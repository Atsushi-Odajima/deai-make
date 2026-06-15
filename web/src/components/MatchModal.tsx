import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { MatchSummary, MeUser } from '../api/types';
import { Avatar } from './Avatar';

interface Props {
  match: MatchSummary | null;
  me: MeUser | null;
  onClose: () => void;
}

export function MatchModal({ match, me, onClose }: Props) {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      {match && (
        <motion.div
          className="match-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="match-card"
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="match-kicker">It's a Match!</p>
            <h2 className="match-title">{match.user.displayName}さんとつながりました</h2>
            <div className="match-avatars">
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Avatar src={me?.photos[0]} name={me?.displayName ?? 'You'} size={92} ring />
              </motion.div>
              <motion.div
                className="match-spark"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 400 }}
              >
                ✦
              </motion.div>
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Avatar src={match.user.photos[0]} name={match.user.displayName} size={92} ring />
              </motion.div>
            </div>
            <button
              className="btn btn-primary btn-block"
              onClick={() => navigate(`/app/chat/${match.id}`)}
            >
              メッセージを送る
            </button>
            <button className="btn btn-ghost btn-block" onClick={onClose}>
              スワイプを続ける
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

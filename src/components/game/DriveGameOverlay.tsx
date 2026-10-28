import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Heart,
  RotateCcw,
  Sparkles,
  Wind,
  X,
} from 'lucide-react';
import { createDriveGame, GAME, type DriveGame, type HudState, type TouchControl } from '@/game';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { setScenesPaused } from '@/lib/scenePause';
import styles from './DriveGameOverlay.module.css';

interface DriveGameOverlayProps {
  onClose: () => void;
}

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const TOUCH_BUTTONS: Array<{
  control: TouchControl;
  label: string;
  icon: typeof ArrowUp;
  side: 'left' | 'right';
}> = [
  { control: 'left', label: 'Steer left', icon: ArrowLeft, side: 'left' },
  { control: 'right', label: 'Steer right', icon: ArrowRight, side: 'left' },
  { control: 'drift', label: 'Drift', icon: Wind, side: 'right' },
  { control: 'brake', label: 'Brake', icon: ArrowDown, side: 'right' },
  { control: 'gas', label: 'Gas', icon: ArrowUp, side: 'right' },
];

/** Full-screen dialog that hosts the driving game and its HUD. */
export default function DriveGameOverlay({ onClose }: DriveGameOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<DriveGame | null>(null);
  const supported = useWebGLSupport();
  const [hud, setHud] = useState<HudState | null>(null);
  const [failed, setFailed] = useState(false);

  // Create the game once the canvas exists, and tear it down on close.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !supported) return;
    let game: DriveGame | null = null;
    const frame = requestAnimationFrame(() => {
      try {
        game = createDriveGame(canvas, minimapRef.current, setHud);
        gameRef.current = game;
      } catch (error) {
        console.warn('Drive game unavailable.', error);
        setFailed(true);
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      game?.dispose();
      gameRef.current = null;
    };
  }, [supported]);

  // Lock page scroll, close on Escape, and return focus to the opener afterwards.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    setScenesPaused(true);
    dialogRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = overflow;
      setScenesPaused(false);
      window.removeEventListener('keydown', handleKey);
      opener?.focus();
    };
  }, [onClose]);

  const phase = hud?.phase;
  // Keep keyboard focus off buttons while driving so space doesn't press them.
  useEffect(() => {
    if (phase === 'countdown') dialogRef.current?.focus();
  }, [phase]);

  const unavailable = !supported || failed;
  const touchHandlers = (control: TouchControl) => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      gameRef.current?.setTouch(control, true);
    },
    onPointerUp: () => gameRef.current?.setTouch(control, false),
    onPointerCancel: () => gameRef.current?.setTouch(control, false),
    onLostPointerCapture: () => gameRef.current?.setTouch(control, false),
    onContextMenu: (event: ReactMouseEvent) => event.preventDefault(),
  });

  return createPortal(
    <div
      ref={dialogRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drive-title"
      tabIndex={-1}
      data-testid="dialog-drive-game"
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.stats}>
          <span className={styles.score} data-testid="text-game-score">
            <Heart size={18} aria-hidden="true" fill="currentColor" />
            {hud?.score ?? 0}
          </span>
          <span className={styles.best}>best {hud?.best ?? 0}</span>
        </div>
        <span
          className={`${styles.timer} ${hud && hud.phase === 'playing' && hud.timeLeft <= 10 ? styles.timerLow : ''}`}
          aria-label="Time left"
          data-testid="text-game-timer"
        >
          {formatTime(hud?.timeLeft ?? GAME.roundSeconds)}
        </span>
        <div className={styles.controls}>
          {phase === 'playing' || phase === 'over' ? (
            <button
              type="button"
              className={styles.iconButton}
              onClick={(event) => {
                gameRef.current?.restart();
                event.currentTarget.blur();
              }}
              aria-label="Restart round"
              data-testid="button-game-restart"
            >
              <RotateCcw size={18} />
            </button>
          ) : null}
          <button
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            aria-label="Close the game"
            data-testid="button-game-close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <canvas ref={minimapRef} className={styles.minimap} aria-hidden="true" />

      {hud?.boosting && phase === 'playing' ? (
        <span className={styles.boost}>
          <Sparkles size={15} aria-hidden="true" /> boost!
        </span>
      ) : null}

      {phase === 'countdown' ? (
        <span key={hud?.countdown} className={styles.countdown} aria-live="assertive">
          {hud?.countdown}
        </span>
      ) : null}
      {phase === 'playing' && hud?.timeLeft === GAME.roundSeconds ? (
        <span className={styles.countdown}>go!</span>
      ) : null}

      {phase === 'playing' ? (
        <p className={styles.keys} aria-hidden="true">
          <kbd>W A S D</kbd> or arrows to drive · <kbd>space</kbd> to drift · <kbd>R</kbd> restart ·{' '}
          <kbd>esc</kbd> leave
        </p>
      ) : null}

      {/* Touch controls */}
      {phase === 'playing' ? (
        <div className={styles.touch}>
          {(['left', 'right'] as const).map((side) => (
            <div key={side} className={styles.touchGroup}>
              {TOUCH_BUTTONS.filter((button) => button.side === side).map(
                ({ control, label, icon: Icon }) => (
                  <button
                    key={control}
                    type="button"
                    className={`${styles.touchButton} ${control === 'gas' ? styles.gas : ''}`}
                    aria-label={label}
                    {...touchHandlers(control)}
                  >
                    <Icon size={26} aria-hidden="true" />
                  </button>
                ),
              )}
            </div>
          ))}
        </div>
      ) : null}

      {/* Panels */}
      {unavailable ? (
        <div className={styles.panel}>
          <h2 id="drive-title" className={`display ${styles.panelTitle}`}>
            Oh no, no WebGL
          </h2>
          <p>This little game needs WebGL, which isn&rsquo;t available in this browser.</p>
          <button type="button" className="button button-primary" onClick={onClose}>
            back to the portfolio
          </button>
        </div>
      ) : !hud ? (
        <div className={styles.loading}>
          <span id="drive-title" className="hand">
            warming up the engine&hellip;
          </span>
        </div>
      ) : phase === 'intro' ? (
        <div className={styles.panel}>
          <p className="hand">you found my secret!</p>
          <h2 id="drive-title" className={`display ${styles.panelTitle}`}>
            Pink Drive
          </h2>
          <p>
            Take my little car around the island and grab as many hearts as you can in{' '}
            {GAME.roundSeconds} seconds. Stars are worth three, mint pads give you a boost, and the
            cones are there to be knocked over.
          </p>
          <ul className={styles.howTo}>
            <li>
              <kbd>W A S D</kbd> / arrows drive
            </li>
            <li>
              <kbd>space</kbd> drift
            </li>
            <li>on a phone, use the buttons</li>
          </ul>
          <button
            type="button"
            className="button button-primary"
            onClick={() => gameRef.current?.start()}
            autoFocus
            data-testid="button-game-start"
          >
            let&rsquo;s drive
          </button>
        </div>
      ) : phase === 'over' ? (
        <div className={styles.panel} data-testid="panel-game-over">
          <p className="hand">{hud.newBest ? 'new best score!' : 'time’s up!'}</p>
          <h2 id="drive-title" className={`display ${styles.panelTitle}`}>
            {hud.score} {hud.score === 1 ? 'heart' : 'hearts'}
          </h2>
          <p>
            {hud.newBest ? 'That’s your best drive yet.' : `Your best is ${hud.best}. One more go?`}
          </p>
          <div className={styles.panelActions}>
            <button
              type="button"
              className="button button-primary"
              onClick={() => gameRef.current?.restart()}
              autoFocus
            >
              drive again
            </button>
            <button type="button" className="button" onClick={onClose}>
              back to the portfolio
            </button>
          </div>
        </div>
      ) : (
        <h2 id="drive-title" className="visually-hidden">
          Pink Drive
        </h2>
      )}
    </div>,
    document.body,
  );
}

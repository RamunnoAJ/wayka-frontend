export type WaykaCameraMode = 'foto' | 'documento';
export type WaykaCameraStatus = 'listo' | 'revisando' | 'procesando' | 'sin-permiso';
export type WaykaCameraFlash = 'off' | 'auto' | 'on';

export interface CameraCaptureProps {
  /** listo = visor vivo · revisando = toma congelada con Repetir/Usar · procesando = confirmada, guardando · sin-permiso = sin acceso. */
  status?: WaykaCameraStatus;
  mode?: WaykaCameraMode;
  /** Modos ofrecidos, en orden. Un solo modo oculta el selector. */
  modes?: WaykaCameraMode[];
  flash?: WaykaCameraFlash;
  /** Para qué se está sacando la foto: "Herida · Mora". Va arriba, centrado. */
  title?: string;
  /** Reemplaza la ayuda de encuadre del modo. */
  hint?: string;
  /** Fotograma vivo o toma congelada. El consumidor lo aporta (RN Camera, <video>, dataURL). */
  previewSrc?: string;
  galleryThumb?: string;
  galleryCount?: number;
  confirmLabel?: string;
  retakeLabel?: string;
  deniedTitle?: string;
  /** Consecuencia concreta de no tener cámara. Sin insistir con el prompt. */
  deniedBody?: string;
  /** false = a sangre, sin radio (pantalla completa nativa). */
  framed?: boolean;
  onCapture?: () => void;
  onRetake?: () => void;
  onConfirm?: () => void;
  onClose?: () => void;
  onFlip?: () => void;
  onGallery?: () => void;
  onModeChange?: (mode: WaykaCameraMode) => void;
  onFlashChange?: (flash: WaykaCameraFlash) => void;
  onOpenSettings?: () => void;
}
export declare function CameraCapture(props: CameraCaptureProps): JSX.Element;
export declare const CAMERA_MODES: Record<WaykaCameraMode, { label: string; icon: string; hint: string }>;

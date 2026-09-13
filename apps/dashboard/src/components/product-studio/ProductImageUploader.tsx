import React, { useRef } from 'react';
import { Camera, UploadCloud, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import type { ImageClusterVariants } from '../../lib/compressImage';

export interface AngleImageEntry {
  file?: File;
  previewUrl: string;
  variants?: ImageClusterVariants;
  imageId?: string;
  isProcessing?: boolean;
}

export type AngleType = 'front' | 'back' | 'side';

export type ColorAnglesMap = Record<
  string, // colorName
  {
    front?: AngleImageEntry;
    back?: AngleImageEntry;
    side?: AngleImageEntry;
  }
>;

interface ProductImageUploaderProps {
  selectedColors: string[];
  colorAngles: ColorAnglesMap;
  onAngleFileSelected: (colorName: string, angle: AngleType, file: File) => void;
  onAngleRemoved: (colorName: string, angle: AngleType) => void;
  getColorHex: (colorName: string) => string;
  imageWarning: string | null;
  isUploadingToR2?: boolean;
}

const ANGLE_CONFIG: Record<AngleType, { label: string; tag: string; isRequired: boolean }> = {
  front: {
    label: 'Front',
    tag: 'Required',
    isRequired: true,
  },
  back: {
    label: 'Back',
    tag: 'Optional',
    isRequired: false,
  },
  side: {
    label: 'Side',
    tag: 'Optional',
    isRequired: false,
  },
};

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  selectedColors,
  colorAngles,
  onAngleFileSelected,
  onAngleRemoved,
  getColorHex,
  imageWarning,
  isUploadingToR2 = false,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        border: '1px solid #e8e2d8',
        padding: '1.125rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0eae1',
          paddingBottom: '0.625rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <div
            style={{
              width: '1.5rem',
              height: '1.5rem',
              borderRadius: '50%',
              backgroundColor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
            }}
          >
            <Camera size={14} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#211a13' }}>
              Angle Studio (Cloudflare R2 Direct)
            </h3>
          </div>
        </div>
        <span style={{ fontSize: '0.6875rem', color: '#8a7a6a' }}>
          Auto 3-WebP Compression
        </span>
      </div>

      {imageWarning && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#b45309',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{imageWarning}</span>
        </div>
      )}

      {selectedColors.length === 0 ? (
        <div
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            border: '1.5px dashed #e8e2d8',
            borderRadius: '0.375rem',
            backgroundColor: '#fcfbf9',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
            No Colors Selected
          </p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.6875rem', color: '#8a7a6a' }}>
            Pick a color from the dropdown above to open its angle slots.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {selectedColors.map((colorName, colorIdx) => {
            const hex = getColorHex(colorName);
            const isPrimary = colorIdx === 0;
            const angles = colorAngles[colorName] || {};
            const hasFront = Boolean(angles.front?.previewUrl);

            return (
              <div
                key={colorName}
                style={{
                  border: isPrimary ? '1.5px solid #0ea5e9' : '1px solid #e8e2d8',
                  borderRadius: '0.375rem',
                  backgroundColor: '#ffffff',
                  padding: '0.75rem',
                  boxShadow: isPrimary ? '0 2px 4px -1px rgba(14, 165, 233, 0.15)' : 'none',
                }}
              >
                {/* Compact Color Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.625rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div
                      style={{
                        width: '13px',
                        height: '13px',
                        borderRadius: '50%',
                        backgroundColor: hex,
                        border: '1px solid #dcd6cc',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#211a13' }}>
                      {colorName}
                    </span>
                    {isPrimary && (
                      <span
                        style={{
                          backgroundColor: '#8b3224',
                          color: '#ffffff',
                          fontSize: '0.5625rem',
                          fontWeight: 800,
                          padding: '0.1rem 0.35rem',
                          borderRadius: '0.2rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        Cover
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: hasFront ? '#166534' : '#b91c1c',
                    }}
                  >
                    {hasFront ? '✓ Front ready' : '⚠️ Front required'}
                  </span>
                </div>

                {/* 3 Compact Angle Slots in 1 Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                  }}
                >
                  {(['front', 'back', 'side'] as AngleType[]).map((angle) => {
                    const cfg = ANGLE_CONFIG[angle];
                    const entry = angles[angle];

                    return (
                      <CompactAngleSlot
                        key={angle}
                        colorName={colorName}
                        angle={angle}
                        cfg={cfg}
                        entry={entry}
                        onFileSelected={(file) => onAngleFileSelected(colorName, angle, file)}
                        onRemove={() => onAngleRemoved(colorName, angle)}
                        disabled={isUploadingToR2}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface CompactAngleSlotProps {
  colorName: string;
  angle: AngleType;
  cfg: { label: string; tag: string; isRequired: boolean };
  entry?: AngleImageEntry;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
  disabled: boolean;
}

const CompactAngleSlot: React.FC<CompactAngleSlotProps> = ({
  colorName,
  angle: _angle,
  cfg,
  entry,
  onFileSelected,
  onRemove,
  disabled,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelected(file);
      }
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{
        border: entry?.previewUrl
          ? '1px solid #dcd6cc'
          : cfg.isRequired
          ? '1.5px dashed #b45309'
          : '1px dashed #cbd5e1',
        borderRadius: '0.25rem',
        backgroundColor: entry?.previewUrl ? '#ffffff' : cfg.isRequired ? '#fffdfa' : '#fcfbf9',
        padding: '0.35rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }}
    >
      {/* Mini Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#211a13' }}>
          {cfg.label}
        </span>
        <span
          style={{
            fontSize: '0.5rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            padding: '0.05rem 0.25rem',
            borderRadius: '0.15rem',
            backgroundColor: cfg.isRequired
              ? entry?.previewUrl
                ? '#f0fdf4'
                : '#fef2f2'
              : '#f1f5f9',
            color: cfg.isRequired
              ? entry?.previewUrl
                ? '#166534'
                : '#b91c1c'
              : '#64748b',
          }}
        >
          {cfg.tag}
        </span>
      </div>

      {/* Compact Thumbnail Container (height 72px) */}
      {entry?.previewUrl ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '72px',
            borderRadius: '0.2rem',
            overflow: 'hidden',
            backgroundColor: '#f5efe6',
          }}
        >
          <img
            src={entry.previewUrl}
            alt={`${colorName} ${cfg.label}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {entry.isProcessing && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <RefreshCw size={13} className="animate-spin" />
            </div>
          )}

          {!entry.isProcessing && (
            <div
              style={{
                position: 'absolute',
                bottom: '0.15rem',
                left: '0.15rem',
                right: '0.15rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Replace photo"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.15rem',
                  padding: '0.12rem 0.3rem',
                  fontSize: '0.5rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Change
              </button>
              <button
                type="button"
                onClick={onRemove}
                title="Remove photo"
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.85)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.15rem',
                  padding: '0.12rem 0.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={10} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          style={{
            width: '100%',
            height: '72px',
            borderRadius: '0.2rem',
            border: '1px dashed #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: '0.2rem',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            gap: '0.15rem',
          }}
        >
          <UploadCloud size={15} color={cfg.isRequired ? '#0284c7' : '#8a7a6a'} />
          <span
            style={{
              fontSize: '0.5625rem',
              fontWeight: 700,
              color: cfg.isRequired ? '#0284c7' : '#475569',
              textAlign: 'center',
            }}
          >
            {cfg.isRequired ? '+ Front' : '+ Angle'}
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onFileSelected(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
};

import React from 'react';

interface ImageModalProps {
  show: boolean;
  imageUrl: string;
  isUploading: boolean;
  onClose: () => void;
  onImageUrlChange: (url: string) => void;
  onOpenFileDialog: () => void;
  onInsertFromUrl: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  show,
  imageUrl,
  isUploading,
  onClose,
  onImageUrlChange,
  onOpenFileDialog,
  onInsertFromUrl
}) => {
  if (!show) return null;

  return (
    <div className="hh-image-modal-overlay" onClick={() => !isUploading && onClose()}>
      <div className="hh-image-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hh-image-modal-header">
          <h3>Chèn hình ảnh</h3>
          <button
            className="hh-image-modal-close"
            onClick={() => !isUploading && onClose()}
            disabled={isUploading}
          >
            ×
          </button>
        </div>

        <div className="hh-image-modal-body">
          <div className="hh-image-upload-options">
            <div className="hh-upload-option">
              <button
                className="hh-upload-button"
                onClick={onOpenFileDialog}
                disabled={isUploading}
              >
                📁 Chọn file từ máy
              </button>
              <p className="hh-upload-hint">Chọn ảnh từ máy tính của bạn (JPG, PNG, GIF, max 10MB)</p>
            </div>

            <div className="hh-upload-divider">
              <span>HOẶC</span>
            </div>

            <div className="hh-upload-option">
              <input
                type="text"
                className="hh-image-url-input"
                placeholder="Nhập URL hình ảnh (https://...)"
                value={imageUrl}
                onChange={(e) => onImageUrlChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onInsertFromUrl()}
                disabled={isUploading}
              />
              <button
                className="hh-insert-url-button"
                onClick={onInsertFromUrl}
                disabled={isUploading || !imageUrl.trim()}
              >
                Chèn từ URL
              </button>
            </div>
          </div>

          {isUploading && (
            <div className="hh-upload-progress">
              <div className="hh-upload-spinner"></div>
              <p>Đang xử lý ảnh...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


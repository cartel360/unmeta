'use client';
import { useRef, useState } from 'react';
import { FileImage, ImagePlus, Plus, Upload, ArrowUpRight, LockKeyhole } from 'lucide-react';
import { Button } from './ui/button';
export function UploadArea({
  adding,
  disabled,
  onFiles,
  onChoose,
}: {
  adding: boolean;
  disabled: boolean;
  onFiles: (files: File[]) => Promise<void>;
  onChoose: () => void;
}) {
  const [drag, setDrag] = useState(false);
  const depth = useRef(0);
  return (
    <div className="upload-wrap">
      <div
        className={`dropzone ${drag ? 'dragging' : ''}`}
        onDragEnter={(e) => {
          e.preventDefault();
          depth.current++;
          setDrag(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (--depth.current <= 0) setDrag(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          depth.current = 0;
          setDrag(false);
          void onFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <div className="upload-art" aria-hidden="true">
          <div className="image-sheet sheet-back">
            <FileImage size={34} />
          </div>
          <div className="image-sheet sheet-front">
            <ImagePlus size={36} />
            <span>
              <Plus size={12} />
            </span>
          </div>
        </div>
        <h2>
          {adding
            ? 'Reading your images…'
            : drag
              ? 'Drop them right here.'
              : 'Drop the image. Keep the privacy.'}
        </h2>
        <p>Drag & drop your images here, or browse your files.</p>
        <Button onClick={onChoose} disabled={disabled}>
          <Upload size={16} />
          {adding ? 'Inspecting…' : 'Choose images'}
          <ArrowUpRight size={16} />
        </Button>
        <span className="paste-note">
          or paste an image with <kbd>⌘</kbd> <kbd>V</kbd> <span>/ Ctrl + V</span>
        </span>
        <div className="file-types">
          <span>JPG</span>
          <span>PNG</span>
          <span>WEBP</span>
          <i />
          Up to 30 MB per image
        </div>
      </div>
      <div className="upload-bottom">
        <span>
          <LockKeyhole size={13} /> Your files never leave this browser.
        </span>
        <span>Not even for a second.</span>
      </div>
    </div>
  );
}

import React, { useState, useCallback, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { PreviewCanvas } from './components/PreviewCanvas';
import { TextConfig, Frame, PhotoConfig, FontType } from './types';
import { detectFrame, renderCanvas } from './utils/canvasUtils';
import { DEFAULT_CANVAS_SIZE, DEFAULT_FRAME, DEFAULT_TEXT_CONFIG, DEFAULT_PHOTO_CONFIG } from './constants';

const App: React.FC = () => {
  // Assets
  const [templateImg, setTemplateImg] = useState<HTMLImageElement | null>(null);
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [frame, setFrame] = useState<Frame>(DEFAULT_FRAME);
  
  // Configuration
  const [textConfig, setTextConfig] = useState<TextConfig>(DEFAULT_TEXT_CONFIG);
  const [photoConfig, setPhotoConfig] = useState<PhotoConfig>(DEFAULT_PHOTO_CONFIG);

  // Render State
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Initialize Fonts
  useEffect(() => {
    document.fonts.ready.then(() => {
       console.log("Fonts loaded");
    });
  }, []);

  // Handlers
  const handleTemplateUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setTemplateImg(img);
      const detected = detectFrame(img, DEFAULT_CANVAS_SIZE, DEFAULT_CANVAS_SIZE);
      setFrame(detected);
    };
    img.src = url;
  }, []);

  const handlePhotoUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setPhotoImg(img);
      setPhotoConfig(DEFAULT_PHOTO_CONFIG); // Reset pan/zoom on new photo
    };
    img.src = url;
  }, []);

  const handleFontUpload = useCallback(async (file: File) => {
    const fontName = 'CustomFont_' + Date.now();
    const buffer = await file.arrayBuffer();
    const font = new FontFace(fontName, buffer);
    
    try {
      await font.load();
      document.fonts.add(font);
      setTextConfig(prev => ({
        ...prev,
        fontFamily: fontName,
        customFontName: fontName
      }));
    } catch (err) {
      console.error("Failed to load custom font", err);
      alert("Failed to load custom font. Please try a valid TTF/WOFF file.");
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!canvasRef) return;
    setIsDownloading(true);
    
    // Perform a fresh render with indicators disabled before export
    setTimeout(async () => {
        try {
            const originalIndicators = textConfig.showGapIndicators;
            
            // Step 1: Force re-render without indicators for the final image
            await renderCanvas(canvasRef, templateImg, photoImg, frame, { ...textConfig, showGapIndicators: false }, photoConfig);

            const link = document.createElement('a');
            const now = new Date();
            const dateStr = now.toISOString().slice(0,10);
            link.download = `TakbeerNews_${dateStr}_${now.getTime()}.png`;
            link.href = canvasRef.toDataURL('image/png', 1.0);
            link.click();
            
            // Step 2: Restore the indicators if they were enabled
            if (originalIndicators) {
                await renderCanvas(canvasRef, templateImg, photoImg, frame, textConfig, photoConfig);
            }
        } catch (e) {
            console.error("Export Error:", e);
            alert("Error downloading image: " + (e instanceof Error ? e.message : "Tainted Canvas issue. Please try using images from your device."));
        } finally {
            setIsDownloading(false);
        }
    }, 100);
  }, [canvasRef, templateImg, photoImg, frame, textConfig, photoConfig]);

  return (
    <div className="flex flex-col-reverse lg:flex-row h-screen w-full bg-gray-100 overflow-hidden font-sans text-gray-900">
      <ControlPanel 
        onTemplateUpload={handleTemplateUpload}
        onPhotoUpload={handlePhotoUpload}
        onFontUpload={handleFontUpload}
        textConfig={textConfig}
        setTextConfig={setTextConfig}
        photoConfig={photoConfig}
        setPhotoConfig={setPhotoConfig}
        onDownload={handleDownload}
        isDownloading={isDownloading}
      />
      <PreviewCanvas 
        templateImg={templateImg}
        photoImg={photoImg}
        frame={frame}
        textConfig={textConfig}
        photoConfig={photoConfig}
        setPhotoConfig={setPhotoConfig}
        setTextConfig={setTextConfig}
        setCanvasRef={setCanvasRef}
      />
    </div>
  );
};

export default App;
import React, { useRef, useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, LayoutTemplate, Download, ZoomIn, Move, Type, AlignLeft, AlignCenter, AlignRight, Info, Highlighter, Trash2, ArrowLeftRight, RotateCcw, Undo2 } from 'lucide-react';
import { TextConfig, PhotoConfig, HighlightRange, SpacingAdjustment } from '../types';
import { FONT_OPTIONS } from '../constants';

interface ControlPanelProps {
  onTemplateUpload: (file: File) => void;
  onPhotoUpload: (file: File) => void;
  onFontUpload: (file: File) => void;
  textConfig: TextConfig;
  setTextConfig: (config: TextConfig) => void;
  photoConfig: PhotoConfig;
  setPhotoConfig: (config: PhotoConfig) => void;
  onDownload: () => void;
  isDownloading: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onTemplateUpload,
  onPhotoUpload,
  onFontUpload,
  textConfig,
  setTextConfig,
  photoConfig,
  setPhotoConfig,
  onDownload,
  isDownloading
}) => {
  const templateInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const [highlightColor, setHighlightColor] = useState('#FFD700');
  const [spacingValue, setSpacingValue] = useState(-0.25);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (f: File) => void) => {
    if (e.target.files && e.target.files[0]) {
      callback(e.target.files[0]);
    }
    e.target.value = '';
  };

  const updateText = (key: keyof TextConfig, value: any) => {
    setTextConfig({ ...textConfig, [key]: value });
  };
  
  const updatePhoto = (key: keyof PhotoConfig, value: any) => {
    setPhotoConfig({ ...photoConfig, [key]: value });
  };

  const applyHighlight = () => {
    if (!textAreaRef.current) return;
    
    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;
    
    if (start === end) {
      alert("Please select some text first to highlight it.");
      return;
    }

    const newRange: HighlightRange = { start, end, color: highlightColor };
    
    const updatedHighlights = textConfig.highlights.filter(h => {
        return !(h.start >= start && h.end <= end);
    }).map(h => {
        if (h.start < start && h.end > start && h.end <= end) {
            return { ...h, end: start };
        }
        if (h.start >= start && h.start < end && h.end > end) {
            return { ...h, start: end };
        }
        if (h.start < start && h.end > end) {
            return { ...h, end: start };
        }
        return h;
    });

    setTextConfig({
        ...textConfig,
        highlights: [...updatedHighlights, newRange].sort((a, b) => a.start - b.start)
    });
  };

  const clearHighlights = () => {
    setTextConfig({ ...textConfig, highlights: [] });
  };

  const applySpacing = () => {
    if (!textAreaRef.current) return;
    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;
    const content = textConfig.content;

    let gapIndex = -1;

    // Caret-based word gap detection
    if (start === end) {
      if (content[start] === ' ') {
        gapIndex = start;
      } else if (content[start - 1] === ' ') {
        gapIndex = start - 1;
      } else {
        let leftSpace = -1;
        for (let i = start - 1; i >= 0 && content[i] !== '\n'; i--) {
          if (content[i] === ' ') { leftSpace = i; break; }
        }
        let rightSpace = -1;
        for (let i = start; i < content.length && content[i] !== '\n'; i++) {
          if (content[i] === ' ') { rightSpace = i; break; }
        }

        if (leftSpace !== -1 && rightSpace !== -1) {
          gapIndex = (start - leftSpace <= rightSpace - start) ? leftSpace : rightSpace;
        } else {
          gapIndex = leftSpace !== -1 ? leftSpace : (rightSpace !== -1 ? rightSpace : -1);
        }
      }
    } else {
      const sub = content.substring(start, end);
      const firstSpace = sub.indexOf(' ');
      if (firstSpace !== -1) {
        gapIndex = start + firstSpace;
      } else {
        if (content[start - 1] === ' ') gapIndex = start - 1;
        else if (content[end] === ' ') gapIndex = end;
      }
    }

    if (gapIndex === -1) {
      alert("Please place the cursor near a space (word gap) to tighten it.");
      return;
    }

    const newAdjustment: SpacingAdjustment = {
      start: gapIndex,
      end: gapIndex + 1,
      value: spacingValue
    };

    const filtered = (textConfig.spacingAdjustments || []).filter(s => s.start !== gapIndex);

    setTextConfig({
      ...textConfig,
      spacingAdjustments: [...filtered, newAdjustment].sort((a, b) => a.start - b.start)
    });
  };

  const undoLastSpacing = useCallback(() => {
    if (!textConfig.spacingAdjustments || textConfig.spacingAdjustments.length === 0) return;
    setTextConfig({
        ...textConfig,
        spacingAdjustments: textConfig.spacingAdjustments.slice(0, -1)
    });
  }, [textConfig, setTextConfig]);

  const resetSpacing = () => {
    if (!textAreaRef.current) return;
    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;

    const filtered = (textConfig.spacingAdjustments || []).filter(s => {
      const isCaretIn = (start >= s.start && start <= s.end) || (end >= s.start && end <= s.end);
      const isNear = Math.abs(s.start - start) <= 1 || Math.abs(s.end - end) <= 1;
      return !(isCaretIn || isNear);
    });

    setTextConfig({
      ...textConfig,
      spacingAdjustments: filtered
    });
  };

  return (
    <div className="bg-white w-full lg:w-96 flex-shrink-0 border-t lg:border-t-0 lg:border-r border-gray-200 h-[60vh] lg:h-full overflow-y-auto shadow-xl z-20 flex flex-col font-sans">
      <div className="p-3 lg:p-5 bg-gradient-to-r from-green-800 to-green-700 text-white shadow-md">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="bg-white text-green-800 p-0.5 px-2 rounded text-sm font-extrabold">TN</span> Composer
        </h1>
        <p className="text-[11px] text-green-100 mt-1 opacity-80">Takbeer News Generator</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4 lg:space-y-6">
        
        {/* Assets Section */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">1. Assets</h2>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => templateInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-gray-600"
            >
              <LayoutTemplate size={20} className="text-green-600"/>
              <span className="text-xs font-medium">Upload Template</span>
            </button>
            <button 
              onClick={() => photoInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-600"
            >
              <ImageIcon size={20} className="text-blue-600"/>
              <span className="text-xs font-medium">Upload Photo</span>
            </button>
          </div>
          <input type="file" ref={templateInputRef} className="hidden" accept="image/png,image/jpeg" onChange={(e) => handleFileChange(e, onTemplateUpload)} />
          <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, onPhotoUpload)} />
        </section>

        {/* Photo Controls */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>2. Photo Adjustment</span>
            <span className="text-[10px] text-gray-400 font-normal normal-case flex items-center gap-1"><Move size={10}/> Drag to Pan</span>
          </h2>
          
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
             <div className="space-y-1">
               <div className="flex justify-between">
                 <label className="text-xs font-semibold text-gray-600 flex items-center gap-1"><ZoomIn size={12}/> Zoom</label>
                 <span className="text-[10px] text-gray-500 bg-gray-200 px-1 rounded">{photoConfig.zoom.toFixed(1)}x</span>
               </div>
               <input 
                 type="range" min="0.5" max="3.0" step="0.1"
                 value={photoConfig.zoom} 
                 onChange={(e) => updatePhoto('zoom', Number(e.target.value))}
                 className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
               />
             </div>
             
             <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-200">
               <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase">Pan X</label>
                  <input 
                    type="range" min="-1000" max="1000" 
                    value={photoConfig.x} 
                    onChange={(e) => updatePhoto('x', Number(e.target.value))}
                    className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase">Pan Y</label>
                  <input 
                    type="range" min="-1000" max="1000" 
                    value={photoConfig.y} 
                    onChange={(e) => updatePhoto('y', Number(e.target.value))}
                    className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
               </div>
             </div>
          </div>
        </section>

        {/* Text Controls */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
             <span>3. Headline (Urdu)</span>
             <Type size={12} />
          </h2>
          
          <div className="space-y-2">
            <textarea
              ref={textAreaRef}
              value={textConfig.content}
              onChange={(e) => updateText('content', e.target.value)}
              placeholder="خبر کی سرخی..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-right text-lg min-h-[100px] shadow-sm resize-none"
              dir="rtl"
              style={{ 
                fontFamily: textConfig.fontFamily,
                fontWeight: textConfig.fontFamily === 'Urdu Najd V3' ? 900 : 700 
              }}
            />
            
            {/* Word Spacing Controls */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1 uppercase tracking-tight">
                   <ArrowLeftRight size={12}/> Word Spacing Adjustment
                </span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 cursor-pointer" title="Toggle Gap Markers in Preview">
                    <input 
                      type="checkbox" 
                      checked={textConfig.showGapIndicators} 
                      onChange={(e) => updateText('showGapIndicators', e.target.checked)}
                      className="w-3 h-3 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                    />
                    <span className="text-[9px] text-blue-700 font-bold uppercase select-none">Show |</span>
                  </label>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 rounded">{spacingValue.toFixed(2)}em</span>
                </div>
              </div>

              <input 
                type="range" min="-0.6" max="0.1" step="0.01"
                value={spacingValue}
                onChange={(e) => setSpacingValue(Number(e.target.value))}
                className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              
              <div className="flex gap-2">
                <button
                  onClick={applySpacing}
                  className="flex-1 py-1.5 px-2 bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-bold rounded shadow transition-colors"
                >
                  Tighten Gap
                </button>
                <button
                  onClick={undoLastSpacing}
                  disabled={!textConfig.spacingAdjustments?.length}
                  className="py-1.5 px-3 border border-blue-700 text-blue-700 hover:bg-blue-100 text-[10px] font-bold rounded transition-colors flex items-center gap-1 disabled:opacity-30"
                >
                  <Undo2 size={12}/> Undo
                </button>
                <button
                  onClick={resetSpacing}
                  className="py-1.5 px-2 border border-blue-700 text-blue-700 hover:bg-blue-100 text-[10px] font-bold rounded transition-colors flex items-center gap-1"
                >
                  <RotateCcw size={12}/> Reset
                </button>
              </div>
              
              <p className="text-[10px] text-blue-700 italic opacity-80 leading-tight">
                *Place cursor between words to adjust the space.
              </p>
            </div>

            {/* Highlight Controls */}
            <div className="bg-green-50 p-3 rounded-lg border border-green-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-green-800 flex items-center gap-1 uppercase tracking-tight">
                   <Highlighter size={12}/> Highlight Selection
                </span>
                <input 
                  type="color" 
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="w-6 h-6 rounded border border-green-300 cursor-pointer p-0.5 bg-white"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={applyHighlight}
                  className="flex-1 py-1.5 px-2 bg-green-700 hover:bg-green-800 text-white text-[11px] font-bold rounded shadow transition-colors"
                >
                  Apply Highlight
                </button>
                <button
                  onClick={clearHighlights}
                  className="py-1.5 px-2 border border-green-700 text-green-700 hover:bg-green-100 text-[11px] font-bold rounded transition-colors flex items-center gap-1"
                >
                  <Trash2 size={12}/> Clear All
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Urdu Font</label>
                <select 
                  value={textConfig.fontFamily}
                  onChange={(e) => updateText('fontFamily', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-xs bg-white"
                >
                  {FONT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                  {textConfig.customFontName && (
                    <option value={textConfig.customFontName}>{textConfig.customFontName} (Custom)</option>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Urdu Max Lines</label>
                <select 
                  value={textConfig.maxLines}
                  onChange={(e) => updateText('maxLines', Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded text-xs bg-white"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} Lines</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
               onClick={() => fontInputRef.current?.click()}
               className="w-full py-1 text-xs text-green-700 bg-green-50 rounded hover:bg-green-100 border border-green-200 transition-colors"
             >
               + Upload Custom Font (.ttf)
             </button>
             <input type="file" ref={fontInputRef} className="hidden" accept=".ttf,.otf,.woff,.woff2" onChange={(e) => handleFileChange(e, onFontUpload)} />
          </div>

          {/* Text Style Controls */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-4">
             <div className="space-y-1">
                <div className="flex justify-between items-center">
                   <label className="text-xs font-semibold text-gray-600">Base Text Color</label>
                   <span className="text-[10px] text-gray-500 bg-gray-200 px-1 rounded uppercase">{textConfig.color}</span>
                </div>
                <input 
                  type="color" 
                  value={textConfig.color}
                  onChange={(e) => updateText('color', e.target.value)}
                  className="w-full h-8 rounded cursor-pointer border border-gray-300 p-0.5 bg-white"
                />
             </div>

             <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Alignment</label>
                <div className="flex bg-gray-200 rounded p-1 gap-1">
                  {(['right', 'center', 'left'] as const).map((align) => (
                     <button
                       key={align}
                       onClick={() => updateText('textAlign', align)}
                       title={`Align ${align}`}
                       className={`flex-1 p-1.5 rounded flex justify-center items-center transition-all ${textConfig.textAlign === align ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:bg-gray-300'}`}
                     >
                       {align === 'left' && <AlignLeft size={16} />}
                       {align === 'center' && <AlignCenter size={16} />}
                       {align === 'right' && <AlignRight size={16} />}
                     </button>
                  ))}
                </div>
             </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-gray-600">Base Font Size</label>
                <span className="text-[10px] text-gray-500 bg-gray-200 px-1 rounded">{textConfig.fontSize}px</span>
              </div>
              <input 
                type="range" min="36" max="300" 
                value={textConfig.fontSize} 
                onChange={(e) => updateText('fontSize', Number(e.target.value))}
                className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-gray-600">Line Height</label>
                <span className="text-[10px] text-gray-500 bg-gray-200 px-1 rounded">{textConfig.lineHeight}</span>
              </div>
              <input 
                type="range" min="0.8" max="2.0" step="0.05"
                value={textConfig.lineHeight} 
                onChange={(e) => updateText('lineHeight', Number(e.target.value))}
                className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>
          </div>
          
          {/* Text Position Controls */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
             <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-600">Headline Position</label>
                <span className="text-[10px] text-gray-400 font-normal flex items-center gap-1"><Move size={10}/> Drag to Pan</span>
             </div>
             <div className="grid grid-cols-2 gap-3 pt-1">
               <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase">Offset X</label>
                  <input 
                    type="range" min="-500" max="500" 
                    value={textConfig.x} 
                    onChange={(e) => updateText('x', Number(e.target.value))}
                    className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase">Offset Y</label>
                  <input 
                    type="range" min="-500" max="500" 
                    value={textConfig.y} 
                    onChange={(e) => updateText('y', Number(e.target.value))}
                    className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
               </div>
             </div>
          </div>
        </section>

      </div>

      <div className="p-4 lg:p-5 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white p-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Rendering...</span>
            </div>
          ) : (
            <>
              <Download size={18} />
              <span>Download PNG</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
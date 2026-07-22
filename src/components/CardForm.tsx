import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Image,
  Check,
  Plus,
  Upload,
  Loader2,
  Camera,
} from 'lucide-react';
import { VocabularyCard, COLOR_THEMES, ColorThemeName } from '../types';
import { supabase } from '../lib/supabase';

interface CardFormProps {
  onAddCard: (card: Omit<VocabularyCard, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const PARTS_OF_SPEECH = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'other',
];

export default function CardForm({ onAddCard, onClose }: CardFormProps) {
  const [word, setWord] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('noun');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [imageType, setImageType] = useState<'auto' | 'custom' | 'upload'>(
    'upload',
  );
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<ColorThemeName>('indigo');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({
          ...prev,
          upload: 'Please select a valid image file',
        }));
        return;
      }
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
      setUploadedUrl('');
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.upload;
        return copy;
      });
    }
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `cards/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('VocabularyContextImage')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('VocabularyContextImage')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!word.trim()) newErrors.word = 'Word is required';
    if (!definition.trim()) newErrors.definition = 'Definition is required';
    if (!example.trim()) newErrors.example = 'An example sentence is required';

    if (imageType === 'custom') {
      if (!customImageUrl.trim()) {
        newErrors.customImageUrl = 'Image URL is required for custom option';
      } else if (!customImageUrl.startsWith('http')) {
        newErrors.customImageUrl = 'Must start with http:// or https://';
      }
    } else if (imageType === 'upload') {
      if (!selectedFile && !uploadedUrl) {
        newErrors.upload = 'Please choose an image file to upload';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let imageUrl = '';

    if (imageType === 'auto') {
      imageUrl = `https://picsum.photos/seed/${encodeURIComponent(word.trim().toLowerCase())}/800/600`;
    } else if (imageType === 'custom') {
      imageUrl = customImageUrl.trim();
    } else if (imageType === 'upload') {
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else if (selectedFile) {
        setIsUploading(true);
        try {
          imageUrl = await uploadImageToSupabase(selectedFile);
          setUploadedUrl(imageUrl);
        } catch (err: any) {
          console.error('Upload error:', err);
          setErrors((prev) => ({
            ...prev,
            upload: err?.message || 'Failed to upload image to Supabase',
          }));
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }
    }

    onAddCard({
      word: word.trim(),
      pronunciation: pronunciation.trim() ? pronunciation.trim() : undefined,
      partOfSpeech: partOfSpeech,
      definition: definition.trim(),
      example: example.trim(),
      customContext: customContext.trim() ? customContext.trim() : undefined,
      imageUrl,
      colorTheme: selectedTheme,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" />
              Add Vocabulary Card
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Create a new swipeable memory card
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {/* Word and Phonetics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Word <span className="text-red-500">*</span>
              </label>
              <input
                id="form-input-word"
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="e.g. Halcyon"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all ${
                  errors.word
                    ? 'border-red-300 bg-red-50/10 focus:ring-red-500'
                    : 'border-slate-200'
                }`}
              />
              {errors.word && (
                <p className="text-3xs text-red-500 font-medium">
                  {errors.word}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pronunciation (Phonetic)
              </label>
              <input
                id="form-input-pronunciation"
                type="text"
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
                placeholder="e.g. /ˈhalsēən/"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Part of Speech and Theme Color Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Part of Speech
              </label>
              <select
                id="form-input-pos"
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                {PARTS_OF_SPEECH.map((pos) => (
                  <option key={pos} value={pos} className="capitalize">
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Creative Color Theme
              </label>
              <div className="flex items-center gap-2 py-1.5">
                {(Object.keys(COLOR_THEMES) as ColorThemeName[]).map(
                  (theme) => {
                    const details = COLOR_THEMES[theme];
                    const isSelected = selectedTheme === theme;
                    return (
                      <button
                        key={theme}
                        id={`theme-btn-${theme}`}
                        type="button"
                        onClick={() => setSelectedTheme(theme)}
                        className={`w-7 h-7 rounded-full ${details.accent} cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center border-2 ${
                          isSelected
                            ? 'border-slate-800 ring-2 ring-slate-200'
                            : 'border-transparent'
                        }`}
                        title={theme}
                      >
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          </div>

          {/* Definition Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Definition <span className="text-red-500">*</span>
            </label>
            <textarea
              id="form-input-definition"
              rows={2}
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Provide a clear, simple definition for the word..."
              className={`w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all ${
                errors.definition
                  ? 'border-red-300 bg-red-50/10 focus:ring-red-500'
                  : 'border-slate-200'
              }`}
            />
            {errors.definition && (
              <p className="text-3xs text-red-500 font-medium">
                {errors.definition}
              </p>
            )}
          </div>

          {/* Example Sentence */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Contextual Example Sentence{' '}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              id="form-input-example"
              rows={2}
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="e.g. The couple spent a halcyon month on the beach under sunny skies."
              className={`w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all ${
                errors.example
                  ? 'border-red-300 bg-red-50/10 focus:ring-red-500'
                  : 'border-slate-200'
              }`}
            />
            {errors.example && (
              <p className="text-3xs text-red-500 font-medium">
                {errors.example}
              </p>
            )}
          </div>

          {/* Memory Trigger */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              My Personal Memory Trigger (Optional)
            </label>
            <textarea
              id="form-input-trigger"
              rows={2}
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="A personal story, feeling, or prompt that hooks this word to your memory..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Image Option Block */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Card Illustration Image
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setImageType('upload')}
                className={`py-2 px-2 border rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  imageType === 'upload'
                    ? 'border-indigo-500 bg-indigo-50/30 text-indigo-700 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Photo
              </button>

              <button
                type="button"
                onClick={() => setImageType('auto')}
                className={`py-2 px-2 border rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  imageType === 'auto'
                    ? 'border-indigo-500 bg-indigo-50/30 text-indigo-700 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Auto Image
              </button>

              <button
                type="button"
                onClick={() => setImageType('custom')}
                className={`py-2 px-2 border rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  imageType === 'custom'
                    ? 'border-indigo-500 bg-indigo-50/30 text-indigo-700 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Image className="w-3.5 h-3.5" />
                Image URL
              </button>
            </div>

            {imageType === 'upload' ? (
              <div className="space-y-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    errors.upload
                      ? 'border-red-300 bg-red-50/20'
                      : filePreview
                        ? 'border-indigo-200 bg-indigo-50/10'
                        : 'border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/20'
                  }`}
                >
                  {filePreview ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
                      <img
                        src={filePreview}
                        alt="Upload preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                        <Camera className="w-4 h-4" />
                        Change Photo
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center py-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                        <Camera className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        Take photo or upload from phone/computer
                      </p>
                      <p className="text-3xs text-slate-400 mt-1">
                        Saves directly to storage
                      </p>
                    </div>
                  )}
                </div>

                {errors.upload && (
                  <p className="text-3xs text-red-500 font-medium">
                    {errors.upload}
                  </p>
                )}
              </div>
            ) : imageType === 'auto' ? (
              <p className="text-3xs text-slate-400 italic">
                {word.trim()
                  ? `An elegant, abstract illustration matching "${word.trim()}" will be auto-generated.`
                  : 'We will auto-generate an elegant, abstract illustration matching your word.'}
              </p>
            ) : (
              <div className="space-y-1.5 pt-1">
                <input
                  id="form-input-img-url"
                  type="text"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or other absolute URL"
                  className={`w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all ${
                    errors.customImageUrl
                      ? 'border-red-300 bg-red-50/10 focus:ring-red-500'
                      : 'border-slate-200'
                  }`}
                />
                {errors.customImageUrl && (
                  <p className="text-3xs text-red-500 font-medium">
                    {errors.customImageUrl}
                  </p>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isUploading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isUploading}
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Create Card'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

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
import {
  FoodCard,
  COLOR_THEMES,
  ColorThemeName,
  MEAL_TYPES,
  MealType,
} from '../types';
import { supabase } from '../lib/supabase';

interface FoodFormProps {
  onAddFood: (food: Omit<FoodCard, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function FoodForm({ onAddFood, onClose }: FoodFormProps) {
  const [name, setName] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [notes, setNotes] = useState('');
  const [imageType, setImageType] = useState<'auto' | 'custom' | 'upload'>(
    'upload',
  );
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<ColorThemeName>('amber');

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
    const filePath = `foods/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('Food')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('Food').getPublicUrl(filePath);

    return data.publicUrl;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Food name is required';

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
      imageUrl = `https://picsum.photos/seed/${encodeURIComponent(name.trim().toLowerCase())}/800/600`;
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

    onAddFood({
      name: name.trim(),
      mealType,
      notes: notes.trim() ? notes.trim() : undefined,
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
              <Plus className="w-5 h-5 text-emerald-500" />
              Add Food
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Save a food photo and label it for a meal
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
          {/* Name and Meal Type Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Food Name <span className="text-red-500">*</span>
              </label>
              <input
                id="form-input-food-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Grilled Chicken Salad"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all ${
                  errors.name
                    ? 'border-red-300 bg-red-50/10 focus:ring-red-500'
                    : 'border-slate-200'
                }`}
              />
              {errors.name && (
                <p className="text-3xs text-red-500 font-medium">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Meal Type
              </label>
              <select
                id="form-input-meal-type"
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer capitalize"
              >
                {MEAL_TYPES.map((mt) => (
                  <option key={mt} value={mt} className="capitalize">
                    {mt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Theme Color Row */}
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
                      id={`food-theme-btn-${theme}`}
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

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Notes (Optional)
            </label>
            <textarea
              id="form-input-food-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Recipe idea, where to get it, how it tastes..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Image Option Block */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Food Photo
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setImageType('upload')}
                className={`py-2 px-2 border rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  imageType === 'upload'
                    ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700 font-semibold'
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
                    ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700 font-semibold'
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
                    ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700 font-semibold'
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
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : 'border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-emerald-50/20'
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
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
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
                {name.trim()
                  ? `A placeholder photo matching "${name.trim()}" will be auto-generated.`
                  : 'We will auto-generate a placeholder photo matching your food name.'}
              </p>
            ) : (
              <div className="space-y-1.5 pt-1">
                <input
                  id="form-input-food-img-url"
                  type="text"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or other absolute URL"
                  className={`w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all ${
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
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Save Food'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

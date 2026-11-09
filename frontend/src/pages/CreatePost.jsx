import { Alert, Button, FileInput, Select, Spinner, TextInput } from "flowbite-react";
import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useNavigate } from "react-router-dom";
import { HiPhotograph, HiOutlineLink, HiSparkles } from "react-icons/hi";

const PRESET_IMAGES = [
  { label: "Web Dev", url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80" },
  { label: "React", url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80" },
  { label: "AI & Tech", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" },
  { label: "Coding", url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80" },
  { label: "Science", url: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80" },
];

const CreatePost = () => {
  const [file, setFile] = useState(null);
  const [imageUploadProgress, setImageUploadProgress] = useState(null);
  const [imageUploadError, setImageUploadError] = useState(null);
  const [formData, setFormData] = useState({
    category: "uncategorized",
    image: "",
  });
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState(null);
  const [imageSourceMode, setImageSourceMode] = useState("url"); // 'url' or 'upload'
  const navigate = useNavigate();

  const handleUploadImage = async () => {
    try {
      if (!file) {
        setImageUploadError("Please select an image file first");
        return;
      }
      setImageUploadError(null);

      // Check if Firebase API Key is configured
      const hasFirebaseKey = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

      if (hasFirebaseKey) {
        const storage = getStorage(app);
        const fileName = new Date().getTime() + "-" + file.name;
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setImageUploadProgress(progress.toFixed(0));
          },
          (error) => {
            setImageUploadError("Image upload failed: " + error.message);
            setImageUploadProgress(null);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              setImageUploadProgress(null);
              setImageUploadError(null);
              setFormData((prev) => ({ ...prev, image: downloadURL }));
            });
          }
        );
      } else {
        // Fallback: convert file to local base64 data URL
        setImageUploadProgress(50);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageUploadProgress(100);
          setTimeout(() => {
            setImageUploadProgress(null);
            setImageUploadError(null);
            setFormData((prev) => ({ ...prev, image: reader.result }));
          }, 400);
        };
        reader.onerror = () => {
          setImageUploadProgress(null);
          setImageUploadError("Failed to read image file");
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      setImageUploadError("Image upload failed: " + error.message);
      setImageUploadProgress(null);
      console.log(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      setPublishError("Please provide both a title and article content.");
      return;
    }
    setPublishLoading(true);
    setPublishError(null);
    try {
      const res = await fetch(`/api/post/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setPublishLoading(false);
      if (!res.ok) {
        setPublishError(data.message || "Failed to publish article");
        return;
      }
      setPublishError(null);
      navigate(`/post/${data.slug}`);
    } catch (error) {
      setPublishLoading(false);
      setPublishError("Something went wrong while publishing: " + error.message);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto min-h-screen">
      <div className="text-center my-8">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent inline-block">
          Write a New Article
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Share your thoughts, tutorials, and stories with the world.
        </p>
      </div>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        {/* Title and Category Row */}
        <div className="flex flex-col gap-4 sm:flex-row justify-between">
          <TextInput
            type="text"
            placeholder="Article Title..."
            required
            id="title"
            className="flex-1 text-lg"
            value={formData.title || ""}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
          <Select
            value={formData.category || "uncategorized"}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          >
            <option value="uncategorized">Select category</option>
            <option value="web-development">Web Development</option>
            <option value="react">React</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="ai-ml">AI & Machine Learning</option>
            <option value="technology">Technology</option>
            <option value="science">Science</option>
            <option value="history">History</option>
            <option value="automobile">Automobile</option>
            <option value="lifestyle">Lifestyle</option>
          </Select>
        </div>

        {/* Cover Image Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <HiPhotograph className="w-5 h-5 text-purple-500" />
              Cover Image (Optional)
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="xs"
                color={imageSourceMode === "url" ? "purple" : "gray"}
                onClick={() => setImageSourceMode("url")}
              >
                <HiOutlineLink className="mr-1 w-3.5 h-3.5" />
                Image URL
              </Button>
              <Button
                type="button"
                size="xs"
                color={imageSourceMode === "upload" ? "purple" : "gray"}
                onClick={() => setImageSourceMode("upload")}
              >
                <HiPhotograph className="mr-1 w-3.5 h-3.5" />
                Upload File
              </Button>
            </div>
          </div>

          {imageSourceMode === "url" ? (
            <div className="flex flex-col gap-2">
              <TextInput
                type="url"
                placeholder="https://images.unsplash.com/... or any image URL"
                value={formData.image || ""}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
              />
              {/* Presets */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400">
                  <HiSparkles className="w-4 h-4" /> Quick Presets:
                </span>
                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, image: preset.url })}
                    className="px-2.5 py-1 rounded-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-purple-500 text-gray-700 dark:text-gray-300 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex gap-4 items-center justify-between">
              <FileInput
                type="file"
                accept="image/*"
                className="flex-1"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <Button
                type="button"
                gradientDuoTone="purpleToPink"
                size="sm"
                outline
                onClick={handleUploadImage}
                disabled={Boolean(imageUploadProgress)}
              >
                {imageUploadProgress ? (
                  <div className="w-12 h-12">
                    <CircularProgressbar
                      value={Number(imageUploadProgress)}
                      text={`${imageUploadProgress}%`}
                    />
                  </div>
                ) : (
                  "Apply Image"
                )}
              </Button>
            </div>
          )}

          {imageUploadError && (
            <Alert color="failure">{imageUploadError}</Alert>
          )}

          {formData.image && (
            <div className="relative mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img
                src={formData.image}
                alt="Article Cover Preview"
                className="w-full h-64 object-cover"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, image: "" })}
                className="absolute top-2 right-2 px-2.5 py-1 text-xs bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Rich Text Editor */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            Article Content <span className="text-red-500">*</span>
          </label>
          <ReactQuill
            theme="snow"
            placeholder="Write your article story here..."
            className="h-80 mb-14"
            value={formData.content || ""}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, content: value }));
            }}
          />
        </div>

        {/* Submit Button */}
        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            gradientDuoTone="purpleToPink"
            size="lg"
            disabled={publishLoading}
            className="w-full font-bold shadow-md hover:shadow-lg transition"
          >
            {publishLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                <span>Publishing Article...</span>
              </>
            ) : (
              "🚀 Publish Article"
            )}
          </Button>

          {publishError && (
            <Alert color="failure" className="mt-2">
              {publishError}
            </Alert>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreatePost;

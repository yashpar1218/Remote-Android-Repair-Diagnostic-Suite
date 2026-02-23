import { useState } from 'react';
import { 
  MessageSquare, 
  Star, 
  Send, 
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Meh
} from 'lucide-react';

export default function Feedback() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [experience, setExperience] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  const experienceOptions = [
    { value: 'excellent', label: 'Excellent', icon: ThumbsUp, color: 'text-green-400' },
    { value: 'good', label: 'Good', icon: ThumbsUp, color: 'text-green-400' },
    { value: 'average', label: 'Average', icon: Meh, color: 'text-yellow-400' },
    { value: 'poor', label: 'Poor', icon: ThumbsDown, color: 'text-red-400' },
  ];

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="form-card text-center py-12">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
          <p className="text-slate-400 mb-6">
            Your feedback has been submitted successfully. We appreciate your input!
          </p>
          <p className="text-slate-500 text-sm">
            Request ID: #RADS-ABC123XY
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Feedback & Rating</h1>
        <p className="text-slate-400">Help us improve our service by sharing your experience</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="form-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="form-label text-lg">How would you rate your experience?</label>
              <div className="flex justify-center gap-2 my-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-2 transition-transform hover:scale-110"
                  >
                    <Star 
                      size={40} 
                      className={`${
                        star <= (hoverRating || rating) 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-center text-slate-400">
                {rating === 0 && 'Tap to rate'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </div>
            </div>

            <hr className="border-slate-700" />

            {/* Experience */}
            <div>
              <label className="form-label text-lg">How was your overall experience?</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {experienceOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExperience(option.value)}
                    className={`p-4 rounded-lg border transition-colors ${
                      experience === option.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <option.icon 
                      size={24} 
                      className={`mx-auto mb-2 ${experience === option.value ? option.color : 'text-slate-400'}`}
                    />
                    <span className={`text-sm ${experience === option.value ? 'text-white' : 'text-slate-400'}`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="form-label">Additional Comments (Optional)</label>
              <textarea
                className="form-input min-h-[120px]"
                placeholder="Tell us more about your experience..."
              />
            </div>

            {/* Quick Feedback */}
            <div>
              <label className="form-label">What did you like most?</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Quick Response', 'Professional Staff', 'Easy Process', 'Technical Expertise', 'Clear Communication'].map((item) => (
                  <label 
                    key={item}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer"
                  >
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-sm text-slate-300">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Would Recommend */}
            <div>
              <label className="form-label">Would you recommend our service?</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="recommend" value="yes" className="w-4 h-4" />
                  <span className="text-slate-300">Yes, definitely!</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="recommend" value="maybe" className="w-4 h-4" />
                  <span className="text-slate-300">Maybe</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="recommend" value="no" className="w-4 h-4" />
                  <span className="text-slate-300">No</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || rating === 0}
              className="form-button flex items-center justify-center gap-2"
            >
              {loading ? (
                'Submitting...'
              ) : (
                <>
                  <Send size={20} />
                  Submit Feedback
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

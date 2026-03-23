import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  CheckCircle,
  Loader2,
  Meh,
  MessageSquare,
  Send,
  Star,
  ThumbsDown,
  ThumbsUp
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

export default function Feedback() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [experience, setExperience] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [comment, setComment] = useState('');
  const [likedMost, setLikedMost] = useState([]);
  const [recommend, setRecommend] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user?.id) return;

      try {
        setLoadingTickets(true);
        const response = await axios.get(`${API_URL}/api/tickets?customer_id=${user.id}`);
        const eligibleTickets = (response.data || []).filter((ticket) => ['RESOLVED'].includes(ticket.status));
        setTickets(eligibleTickets);
        if (eligibleTickets.length) {
          setSelectedTicketId(eligibleTickets[0].ticket_id);
        }
      } catch (err) {
        console.error('Error fetching feedback tickets:', err);
        setError('Failed to load completed tickets for feedback.');
      } finally {
        setLoadingTickets(false);
      }
    };

    fetchTickets();
  }, [user?.id]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.ticket_id === selectedTicketId) || null,
    [tickets, selectedTicketId]
  );

  const experienceOptions = [
    { value: 'excellent', label: 'Excellent', icon: ThumbsUp, color: 'text-green-400' },
    { value: 'good', label: 'Good', icon: ThumbsUp, color: 'text-green-400' },
    { value: 'average', label: 'Average', icon: Meh, color: 'text-yellow-400' },
    { value: 'poor', label: 'Poor', icon: ThumbsDown, color: 'text-red-400' }
  ];

  const highlightOptions = ['Quick Response', 'Professional Staff', 'Easy Process', 'Technical Expertise', 'Clear Communication'];

  const toggleHighlight = (value) => {
    setLikedMost((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id || !rating) return;

    try {
      setLoading(true);
      setError('');

      await axios.post(`${API_URL}/api/feedback`, {
        customerId: user.id,
        customerName: user.name,
        customerEmail: user.email,
        ticket_id: selectedTicket?.ticket_id || '',
        device_id: selectedTicket?.device_id || '',
        rating,
        experience,
        recommend,
        highlights: likedMost,
        comment
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Feedback submission error:', err);
      setError(err.response?.data?.error || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="form-card text-center py-12">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
          <p className="text-slate-400 mb-6">
            Your feedback has been submitted successfully and saved in MongoDB.
          </p>
          <p className="text-slate-500 text-sm">
            Ticket: {selectedTicket?.ticket_id || 'General feedback'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Feedback & Rating</h1>
        <p className="text-slate-400">Help us improve our service by sharing your experience</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="form-card">
          {loadingTickets ? (
            <div className="flex items-center justify-center py-10 gap-3 text-slate-300">
              <Loader2 className="animate-spin" size={20} />
              Loading completed tickets...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="form-label text-lg">Ticket</label>
                <select
                  value={selectedTicketId}
                  onChange={(e) => setSelectedTicketId(e.target.value)}
                  className="form-input"
                  disabled={!tickets.length}
                >
                  <option value="">{tickets.length ? 'Select a resolved ticket...' : 'No resolved tickets available yet'}</option>
                  {tickets.map((ticket) => (
                    <option key={ticket.ticket_id} value={ticket.ticket_id}>
                      {ticket.ticket_id} - {ticket.device_brand} {ticket.device_model}
                    </option>
                  ))}
                </select>
                {selectedTicket && (
                  <p className="text-sm text-slate-400 mt-2">
                    {selectedTicket.issue_category} for {selectedTicket.device_brand} {selectedTicket.device_model}
                  </p>
                )}
              </div>

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
                        className={star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-slate-700" />

              <div>
                <label className="form-label text-lg">How was your overall experience?</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {experienceOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setExperience(option.value)}
                      className={`p-4 rounded-lg border transition-colors ${
                        experience === option.value ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <option.icon size={24} className={`mx-auto mb-2 ${experience === option.value ? option.color : 'text-slate-400'}`} />
                      <span className={`text-sm ${experience === option.value ? 'text-white' : 'text-slate-400'}`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Additional Comments</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="form-input min-h-[120px]"
                  placeholder="Tell us more about your experience..."
                />
              </div>

              <div>
                <label className="form-label">What did you like most?</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {highlightOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleHighlight(item)}
                      className={`px-3 py-2 rounded-lg text-sm ${likedMost.includes(item) ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Would you recommend our service?</label>
                <div className="flex gap-4 mt-2 flex-wrap">
                  {[
                    ['yes', 'Yes, definitely!'],
                    ['maybe', 'Maybe'],
                    ['no', 'No']
                  ].map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recommend"
                        value={value}
                        checked={recommend === value}
                        onChange={(e) => setRecommend(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-slate-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || rating === 0 || !selectedTicketId}
                className="form-button flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


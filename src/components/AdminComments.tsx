import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/solid';
import supabase from '../lib/supabase/client';

// Type definitions for AdminComments
interface CommentProfile {
  first_name: string;
  last_name: string;
}

interface ApplicationComment {
  id: string;
  application_id: string;
  admin_id: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
  profiles?: CommentProfile;
}

interface AdminCommentsProps {
  applicationId: string;
}

const AdminComments: React.FC<AdminCommentsProps> = ({ applicationId }) => {
  const [comments, setComments] = useState<ApplicationComment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();  // Fetch comments for this application
  const fetchComments = async () => {
    setLoading(true);
    try {      
      // First fetch the comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('application_comments')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        toast({
          title: "Error",
          description: "Failed to load comments",
        });
        return;
      }
      
      // Then fetch profile info for each comment if there are comments
      if (commentsData && commentsData.length > 0) {
        const adminIds = commentsData.map(comment => comment.admin_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', adminIds);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          // Map profiles to comments
          const commentsWithProfiles = commentsData.map(comment => {
            const profile = profilesData?.find(p => p.id === comment.admin_id);
            return {
              ...comment,
              profiles: profile ? {
                first_name: profile.first_name,
                last_name: profile.last_name
              } : undefined
            };
          });
          setComments(commentsWithProfiles);
          return;
        }
      }
      
      // If we get here, we either had no comments or couldn't fetch profiles
      setComments(commentsData || []);
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Failed to load comments",
      });
    } finally {
      setLoading(false);
    }
  };  // Add new comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      // Insert the new comment
      const { data, error } = await supabase
        .from('application_comments')
        .insert([
          {
            application_id: applicationId,
            admin_id: user.id,
            comment_text: newComment.trim(),
          }
        ])
        .select('*');

      if (error) {
        console.error('Error adding comment:', error);
        toast({
          title: "Error",
          description: "Failed to add comment",
        });
      } else {
        setNewComment('');
        await fetchComments(); // Refresh comments to include the new comment with profile data
        toast({
          title: "Success",
          description: "Comment added successfully",
        });
      }
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Failed to add comment",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('application_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        toast({
          title: "Error",
          description: "Failed to delete comment",
        });
      } else {
        await fetchComments(); // Refresh comments
        toast({
          title: "Success",
          description: "Comment deleted successfully",
        });
      }
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Failed to delete comment",
      });
    }
  };

  // Format date for display
  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    if (applicationId) {
      fetchComments();
    }
  }, [applicationId]);

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">Admin Comments</h4>
        <button
          onClick={fetchComments}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Add new comment form */}
      <form onSubmit={handleAddComment} className="mb-4">
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {submitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No comments yet</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-md p-3 shadow-sm border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">                    <span className="font-medium text-sm text-gray-900">
                      {comment.profiles?.first_name} {comment.profiles?.last_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.comment_text}
                  </p>
                </div>
                {comment.admin_id === user?.id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-500 hover:text-red-700 ml-2 p-1"
                    title="Delete comment"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminComments;

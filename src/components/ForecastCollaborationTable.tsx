
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Edit, Save, X, Grid3x3 } from 'lucide-react';
import { useForecastCollaboration } from '@/hooks/useForecastCollaboration';
import { ForecastPivotTable } from './ForecastPivotTable';

interface ForecastCollaborationTableProps {
  data: any[];
  comments: any[];
}

export function ForecastCollaborationTable({ data, comments }: ForecastCollaborationTableProps) {
  const { updateForecastCollaboration, addComment } = useForecastCollaboration();
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  const handleEdit = (row: any) => {
    setEditingRow(row.id);
    setEditData({
      commercial_input: row.commercial_input || row.demand_planner || 0,
      commercial_confidence: row.commercial_confidence || 'medium',
      commercial_notes: row.commercial_notes || '',
      market_intelligence: row.market_intelligence || '',
      promotional_activity: row.promotional_activity || '',
      competitive_impact: row.competitive_impact || ''
    });
  };

  const handleSave = async (forecastId: string) => {
    const success = await updateForecastCollaboration(forecastId, {
      ...editData,
      collaboration_status: 'reviewed'
    });
    
    if (success) {
      setEditingRow(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditData({});
  };

  const handleAddComment = async (forecastId: string) => {
    if (!newComment.trim()) return;
    
    const success = await addComment(forecastId, newComment);
    if (success) {
      setNewComment('');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'pending_review': 'bg-yellow-100 text-yellow-700',
      'reviewed': 'bg-green-100 text-green-700',
      'approved': 'bg-blue-100 text-blue-700',
      'rejected': 'bg-red-100 text-red-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      'low': 'bg-red-100 text-red-700',
      'medium': 'bg-yellow-100 text-yellow-700',
      'high': 'bg-green-100 text-green-700'
    };
    return colors[confidence as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const forecastComments = (forecastId: string) => 
    comments.filter(c => c.forecast_data_id === forecastId);

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin pronósticos asignados</h3>
          <p className="text-muted-foreground">
            No hay pronósticos pendientes de revisión en este momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ForecastPivotTable data={data} comments={comments} />

      {/* Comments Dialog */}
      {showComments && (
        <Dialog open onOpenChange={() => setShowComments(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Comentarios de Colaboración</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {forecastComments(showComments).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Sin comentarios aún
                </p>
              ) : (
                forecastComments(showComments).map((comment) => (
                  <div key={comment.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline">{comment.comment_type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.comment_text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Agregar comentario..."
                rows={3}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={() => handleAddComment(showComments)}
                  disabled={!newComment.trim()}
                >
                  Agregar Comentario
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
